-- ============================================================================
-- Atomic stock adjustment
--
-- "Add 10 units" must be a single UPDATE so two people restocking at the same
-- time cannot overwrite each other. SECURITY INVOKER: RLS still applies, so a
-- caller can only adjust products of their own business.
-- ============================================================================

create function public.adjust_product_stock(p_product_id uuid, p_delta integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_quantity integer;
begin
  if p_delta is null or abs(p_delta) > 1000000 then
    raise exception 'Invalid stock change' using errcode = 'invalid_parameter_value';
  end if;

  update public.products
     set stock_quantity = stock_quantity + p_delta
   where id = p_product_id
  returning stock_quantity into new_quantity;

  -- Not found, or not visible to this user under RLS.
  if new_quantity is null then
    raise exception 'Product not found' using errcode = 'no_data_found';
  end if;

  return new_quantity;
end;
$$;

revoke execute on function public.adjust_product_stock(uuid, integer) from public, anon;
grant execute on function public.adjust_product_stock(uuid, integer) to authenticated, service_role;
