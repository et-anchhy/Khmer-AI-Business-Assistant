-- ============================================================================
-- Khmer AI Business Assistant — core schema
--
-- Every business-owned row carries `business_id`. Child tables reference their
-- parent through a composite (id, business_id) foreign key, so a row can never
-- point at a parent that belongs to a different business — even through the
-- raw API. Access control lives in the next migration (RLS).
-- ============================================================================

create extension if not exists pg_trgm with schema extensions;

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type public.business_language as enum ('km', 'en', 'km_en');
create type public.order_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.knowledge_category as enum (
  'faq', 'business_info', 'delivery_policy', 'return_policy', 'payment_info', 'product_info', 'other'
);
create type public.message_role as enum ('user', 'assistant');

-- ─── Shared trigger: keep updated_at current ────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── profiles: one row per auth user ────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users who signed up before this migration ran.
insert into public.profiles (id, full_name)
select id, left(coalesce(raw_user_meta_data ->> 'full_name', ''), 100)
from auth.users
on conflict (id) do nothing;

-- ─── businesses ─────────────────────────────────────────────────────────────
create table public.businesses (
  id                   uuid primary key default gen_random_uuid(),
  -- One business per owner for the MVP. Dropping this unique constraint (and
  -- adding a members table) is the path to multi-business / staff accounts.
  owner_id             uuid not null unique references public.profiles (id) on delete cascade,
  name                 text not null check (char_length(btrim(name)) between 1 and 120),
  business_type        text not null default 'other'
                         check (business_type in ('clothing', 'online_shop', 'cafe', 'restaurant',
                                                  'beauty', 'electronics', 'grocery', 'other')),
  description          text check (char_length(description) <= 2000),
  phone                text check (char_length(phone) <= 40),
  email                text check (char_length(email) <= 254),
  address              text check (char_length(address) <= 500),
  currency             text not null default 'USD' check (currency in ('USD', 'KHR')),
  opening_hours        text check (char_length(opening_hours) <= 1000),
  delivery_info        text check (char_length(delivery_info) <= 4000),
  payment_info         text check (char_length(payment_info) <= 4000),
  preferred_language   public.business_language not null default 'km_en',
  low_stock_threshold  integer not null default 5 check (low_stock_threshold between 0 and 100000),
  -- Last issued order number; incremented by the orders trigger.
  last_order_number    integer not null default 0 check (last_order_number >= 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- ─── products ───────────────────────────────────────────────────────────────
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses (id) on delete cascade,
  name            text not null check (char_length(btrim(name)) between 1 and 200),
  name_km         text check (char_length(name_km) <= 200),
  description     text check (char_length(description) <= 4000),
  description_km  text check (char_length(description_km) <= 4000),
  sku             text check (char_length(sku) <= 64),
  category        text check (char_length(category) <= 80),
  price           numeric(12, 2) not null default 0 check (price >= 0),
  stock_quantity  integer not null default 0 check (stock_quantity >= 0),
  image_path      text check (char_length(image_path) <= 500),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, business_id),
  unique (business_id, sku)
);

create index products_business_created_idx on public.products (business_id, created_at desc);
create index products_business_category_idx on public.products (business_id, category);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);
create index products_name_km_trgm_idx on public.products using gin (name_km extensions.gin_trgm_ops);
create index products_sku_trgm_idx on public.products using gin (sku extensions.gin_trgm_ops);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ─── customers ──────────────────────────────────────────────────────────────
create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 120),
  phone        text check (char_length(phone) <= 40),
  email        text check (char_length(email) <= 254),
  address      text check (char_length(address) <= 500),
  notes        text check (char_length(notes) <= 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, business_id)
);

create index customers_business_created_idx on public.customers (business_id, created_at desc);
create index customers_name_trgm_idx on public.customers using gin (name extensions.gin_trgm_ops);
create index customers_phone_trgm_idx on public.customers using gin (phone extensions.gin_trgm_ops);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ─── orders ─────────────────────────────────────────────────────────────────
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses (id) on delete cascade,
  order_number    text not null,
  customer_id     uuid,
  status          public.order_status not null default 'pending',
  subtotal        numeric(12, 2) not null default 0 check (subtotal >= 0),
  total           numeric(12, 2) not null default 0 check (total >= 0),
  notes           text check (char_length(notes) <= 2000),
  -- True while this order's quantities are subtracted from product stock.
  -- Maintained only by the order status function (Phase 7).
  stock_deducted  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, business_id),
  unique (business_id, order_number),
  -- Deleting a customer keeps their orders but clears the link.
  foreign key (customer_id, business_id)
    references public.customers (id, business_id) on delete set null (customer_id)
);

create index orders_business_created_idx on public.orders (business_id, created_at desc);
create index orders_business_status_idx on public.orders (business_id, status);
create index orders_customer_idx on public.orders (customer_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Human-friendly per-business order numbers: ORD-00001, ORD-00002, ...
create function public.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_number integer;
begin
  update public.businesses
     set last_order_number = last_order_number + 1
   where id = new.business_id
  returning last_order_number into next_number;

  if next_number is null then
    raise exception 'Business % not found', new.business_id using errcode = 'foreign_key_violation';
  end if;

  new.order_number := 'ORD-' || lpad(next_number::text, 5, '0');
  return new;
end;
$$;

create trigger orders_assign_number
  before insert on public.orders
  for each row execute function public.assign_order_number();

-- ─── order_items ────────────────────────────────────────────────────────────
create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null,
  business_id   uuid not null,
  product_id    uuid,
  -- Snapshot at order time so history survives product edits/deletion.
  product_name  text not null check (char_length(btrim(product_name)) between 1 and 200),
  unit_price    numeric(12, 2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity > 0 and quantity <= 100000),
  line_total    numeric(14, 2) generated always as (unit_price * quantity) stored,
  created_at    timestamptz not null default now(),
  foreign key (order_id, business_id)
    references public.orders (id, business_id) on delete cascade,
  foreign key (product_id, business_id)
    references public.products (id, business_id) on delete set null (product_id)
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_items_business_idx on public.order_items (business_id);

-- ─── knowledge_base ─────────────────────────────────────────────────────────
create table public.knowledge_base (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 1 and 300),
  content      text not null check (char_length(btrim(content)) between 1 and 8000),
  category     public.knowledge_category not null default 'faq',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index knowledge_base_business_idx on public.knowledge_base (business_id, updated_at desc);
create index knowledge_base_title_trgm_idx on public.knowledge_base using gin (title extensions.gin_trgm_ops);
create index knowledge_base_content_trgm_idx on public.knowledge_base using gin (content extensions.gin_trgm_ops);

create trigger knowledge_base_set_updated_at
  before update on public.knowledge_base
  for each row execute function public.set_updated_at();

-- ─── conversations & messages ───────────────────────────────────────────────
create table public.conversations (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  created_by   uuid references public.profiles (id) on delete set null,
  title        text not null default '' check (char_length(title) <= 200),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, business_id)
);

create index conversations_business_updated_idx on public.conversations (business_id, updated_at desc);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null,
  business_id      uuid not null,
  role             public.message_role not null,
  content          text not null check (char_length(content) between 1 and 16000),
  created_at       timestamptz not null default now(),
  foreign key (conversation_id, business_id)
    references public.conversations (id, business_id) on delete cascade
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index messages_business_idx on public.messages (business_id);
