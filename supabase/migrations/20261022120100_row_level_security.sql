-- ============================================================================
-- Row Level Security
--
-- Rule: a signed-in user can read and write a row only if it belongs to a
-- business they own. The anon role gets nothing. The service role (seed script,
-- tests) bypasses RLS and is never used by the app at request time.
-- ============================================================================

-- ─── Helper ─────────────────────────────────────────────────────────────────
-- SECURITY DEFINER so policies on other tables can check ownership without
-- recursively evaluating the businesses policies. To add staff accounts later,
-- change only this function (e.g. also accept rows in business_members).
create function public.is_business_owner(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.businesses b
     where b.id = target_business_id
       and b.owner_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_business_owner(uuid) from public, anon;
grant execute on function public.is_business_owner(uuid) to authenticated, service_role;

-- Trigger-only functions must not be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.assign_order_number() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ─── Table privileges ───────────────────────────────────────────────────────
-- Supabase grants everything to anon/authenticated by default; RLS then
-- filters rows. Remove anon access entirely as defence in depth.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

grant select, insert, update, delete on
  public.products, public.customers, public.orders, public.order_items,
  public.knowledge_base, public.conversations, public.messages
to authenticated;
grant all on all tables in schema public to service_role;

-- profiles: rows are created by the signup trigger; users may only edit their name.
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- businesses: owners cannot touch owner_id after creation or the order counter.
revoke all on public.businesses from authenticated;
grant select, delete on public.businesses to authenticated;
grant insert (owner_id, name, business_type, description, phone, email, address, currency,
              opening_hours, delivery_info, payment_info, preferred_language, low_stock_threshold)
  on public.businesses to authenticated;
grant update (name, business_type, description, phone, email, address, currency,
              opening_hours, delivery_info, payment_info, preferred_language, low_stock_threshold)
  on public.businesses to authenticated;

-- ─── Enable RLS everywhere ──────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.businesses     enable row level security;
alter table public.products       enable row level security;
alter table public.customers      enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;

-- ─── profiles ───────────────────────────────────────────────────────────────
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ─── businesses ─────────────────────────────────────────────────────────────
create policy "Owners can view their business"
  on public.businesses for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Users can create a business they own"
  on public.businesses for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners can update their business"
  on public.businesses for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners can delete their business"
  on public.businesses for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ─── Business-owned tables: identical owner-only policies ───────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'products', 'customers', 'orders', 'order_items', 'knowledge_base', 'conversations', 'messages'
  ]
  loop
    execute format(
      'create policy "Owners can view %1$s" on public.%1$I for select to authenticated
         using (public.is_business_owner(business_id))', t);
    execute format(
      'create policy "Owners can insert %1$s" on public.%1$I for insert to authenticated
         with check (public.is_business_owner(business_id))', t);
    -- WITH CHECK also stops a row being moved to another business.
    execute format(
      'create policy "Owners can update %1$s" on public.%1$I for update to authenticated
         using (public.is_business_owner(business_id))
         with check (public.is_business_owner(business_id))', t);
    execute format(
      'create policy "Owners can delete %1$s" on public.%1$I for delete to authenticated
         using (public.is_business_owner(business_id))', t);
  end loop;
end;
$$;
