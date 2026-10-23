-- Send a new offer after withdrawing one. To stop anyone spamming an owner: only your own withdrawn offer,
-- at least an hour after you withdrew it, at most twice per role, and only while the role is still open.
-- The same offer row (and its conversation) comes back to life with the new note.
-- Keep the numbers in sync with RESEND_COOLDOWN_MINUTES and MAX_RESENDS in src/lib/project.ts.

alter table public.offers
  add column resend_count smallint not null default 0 check (resend_count between 0 and 2),
  add column resent_at    timestamptz;

create function public.resend_offer(p_offer uuid, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_helper uuid; v_role uuid; v_status public.offer_status; v_decided timestamptz; v_count smallint;
  v_note text := btrim(coalesce(p_note, ''));
begin
  select helper_id, role_id, status, decided_at, resend_count
    into v_helper, v_role, v_status, v_decided, v_count
  from public.offers where id = p_offer for update;
  if not found then raise exception 'Offer not found.' using errcode = 'P0002'; end if;
  if v_helper is distinct from auth.uid() then
    raise exception 'Only the person who made the offer can send it again.' using errcode = '42501';
  end if;
  if v_status <> 'withdrawn' then raise exception 'Only a withdrawn offer can be sent again.' using errcode = '22023'; end if;
  if v_count >= 2 then
    raise exception 'You''ve already sent this offer again twice, so it''s closed for this role.' using errcode = '22023';
  end if;
  if v_decided > now() - interval '1 hour' then
    raise exception 'You can send a new offer an hour after withdrawing.' using errcode = '22023';
  end if;
  if not public.can_offer_on(v_role) then
    raise exception 'This role isn''t taking offers right now.' using errcode = '22023';
  end if;
  if char_length(v_note) not between 10 and 600 then
    raise exception 'Say why you''re a good fit (10 to 600 characters).' using errcode = '22023';
  end if;

  update public.offers
     set status = 'pending', note = v_note, decided_at = null, resend_count = resend_count + 1, resent_at = now()
   where id = p_offer;
end $$;

revoke execute on function public.resend_offer(uuid, text) from public, anon;
grant execute on function public.resend_offer(uuid, text) to authenticated;
