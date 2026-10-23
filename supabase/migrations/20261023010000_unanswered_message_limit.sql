-- Anti-spam: while an offer is pending and the owner hasn't written back, the helper can send at most 5 messages
-- (counted since the offer was sent or last resent; the offer's own note doesn't count). Once the owner sends any
-- message, or accepts, there's no limit. Keep the number in sync with UNANSWERED_LIMIT in src/lib/messages.ts.

create function public.enforce_unanswered_message_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_helper uuid; v_status public.offer_status; v_since timestamptz; v_sent int;
begin
  -- Lock the offer so two messages sent at the same moment can't both slip under the limit.
  select helper_id, status, coalesce(resent_at, created_at) into v_helper, v_status, v_since
  from public.offers where id = new.offer_id for update;
  if not found or v_status <> 'pending' or new.sender_id is distinct from v_helper then return new; end if;
  if exists (select 1 from public.messages where offer_id = new.offer_id and sender_id <> v_helper) then return new; end if;

  select count(*) into v_sent from public.messages
  where offer_id = new.offer_id and sender_id = v_helper and created_at >= v_since;
  if v_sent >= 5 then
    raise exception 'You can send up to 5 messages until they reply or accept your offer.' using errcode = '22023';
  end if;
  return new;
end $$;

revoke execute on function public.enforce_unanswered_message_limit() from public, anon, authenticated;

create trigger messages_unanswered_limit
  before insert on public.messages
  for each row execute function public.enforce_unanswered_message_limit();
