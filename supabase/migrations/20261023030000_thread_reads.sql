-- Unread conversations, for the red dot on Messages. We remember when each person last opened each conversation;
-- a conversation is unread when the other person has messaged since then (or, for the owner, a new or resent
-- offer arrived since then).

create table public.thread_reads (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  offer_id     uuid not null references public.offers (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

alter table public.thread_reads enable row level security;
revoke all on public.thread_reads from anon;
revoke insert, update, delete on public.thread_reads from authenticated;
create policy "see your own read markers" on public.thread_reads
  for select to authenticated using (user_id = (select auth.uid()));

-- Opening a conversation marks it read. Quietly does nothing for conversations you're not in.
create function public.mark_thread_read(p_offer uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.other_participant(p_offer) is null then return; end if;
  insert into public.thread_reads (user_id, offer_id) values (auth.uid(), p_offer)
  on conflict (user_id, offer_id) do update set last_read_at = now();
end $$;

-- My conversations with something new from the other person since I last opened them.
create function public.unread_offer_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select o.id
  from public.offers o
  join public.roles r    on r.id = o.role_id
  join public.projects p on p.id = r.project_id
  left join public.thread_reads t on t.offer_id = o.id and t.user_id = (select auth.uid())
  where (select auth.uid()) in (o.helper_id, p.owner_id)
    and (
      (p.owner_id = (select auth.uid()) and o.status = 'pending'
        and coalesce(o.resent_at, o.created_at) > coalesce(t.last_read_at, '-infinity'::timestamptz))
      or exists (
        select 1 from public.messages m
        where m.offer_id = o.id and m.sender_id <> (select auth.uid())
          and m.created_at > coalesce(t.last_read_at, '-infinity'::timestamptz)
      )
    )
$$;

revoke execute on function public.mark_thread_read(uuid), public.unread_offer_ids() from public, anon;
grant execute on function public.mark_thread_read(uuid), public.unread_offer_ids() to authenticated;
