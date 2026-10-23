-- ============================================================================
-- Keep conversations sorted by latest activity
--
-- A new message bumps its conversation's updated_at. SECURITY INVOKER: the
-- caller already owns the conversation (the composite foreign key and RLS
-- guarantee it), so no extra privileges are needed.
-- ============================================================================

create function public.touch_conversation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.conversations
     set updated_at = now()
   where id = new.conversation_id
     and business_id = new.business_id;
  return null;
end;
$$;

revoke execute on function public.touch_conversation() from public, anon, authenticated;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();
