-- Opt-in for occasional update emails (new features, an app launch). Off unless the person ticks the box.
-- Kept in its own table, not on profiles, because other students can read profiles; only you can see this.
-- Account emails (sign-in links, password resets) don't depend on it.

create table public.email_preferences (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  updates    boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.email_preferences enable row level security;
revoke all on public.email_preferences from anon;
revoke delete on public.email_preferences from authenticated;
grant select, insert, update on public.email_preferences to authenticated;

create policy "see your own email preferences" on public.email_preferences
  for select to authenticated using (user_id = (select auth.uid()));
create policy "set your own email preferences" on public.email_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "change your own email preferences" on public.email_preferences
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Record when the choice was made, whatever the client sends.
create function public.touch_email_preferences() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger email_preferences_touch before insert or update on public.email_preferences
  for each row execute function public.touch_email_preferences();
