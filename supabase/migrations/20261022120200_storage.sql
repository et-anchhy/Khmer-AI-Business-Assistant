-- ============================================================================
-- Storage: product images
--
-- Objects are stored as "<business_id>/<random>.<ext>". Writes are allowed only
-- under the caller's own business folder. The bucket is public-read because
-- product photos are not sensitive and will later be shown to shoppers; the
-- object names are unguessable UUIDs.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Business id from the first path segment, or null if it is not a UUID
-- (avoids a cast error inside the policy for malformed names).
create function public.business_id_from_storage_path(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(object_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(object_name, '/', 1)::uuid
  end;
$$;

create policy "Owners can upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_business_owner(public.business_id_from_storage_path(name))
  );

create policy "Owners can update product images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_business_owner(public.business_id_from_storage_path(name))
  )
  with check (
    bucket_id = 'product-images'
    and public.is_business_owner(public.business_id_from_storage_path(name))
  );

create policy "Owners can delete product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_business_owner(public.business_id_from_storage_path(name))
  );

-- Listing the bucket through the API is limited to the owner's folder.
-- (Public URLs are served by the storage CDN and do not need this policy.)
create policy "Owners can list their product images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_business_owner(public.business_id_from_storage_path(name))
  );
