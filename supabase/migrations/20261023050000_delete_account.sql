-- "Delete my account" in Edit profile. Deletes only the caller's own auth user; their profile, projects, roles,
-- offers, messages, credits, reports, blocks and read markers all cascade from it. No admin key in the app:
-- the function runs as the database owner and is hard-wired to auth.uid().

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  delete from auth.users where id = v_me;
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
