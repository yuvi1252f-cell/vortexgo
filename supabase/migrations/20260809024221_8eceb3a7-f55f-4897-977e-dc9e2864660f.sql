
drop policy if exists "entries readable by players" on public.tournament_entries;

create policy "players read own entries"
on public.tournament_entries
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.tournament_roster(p_tournament uuid)
returns table (id uuid, ff_name text, team_no int, slot_position text, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.ff_name, e.team_no, e."position", e.user_id = auth.uid()
  from public.tournament_entries e
  where e.tournament_id = p_tournament
  order by e.team_no
$$;

create or replace function public.recent_winners()
returns table (id uuid, ff_name text, prize int, kills int, rank int, title text)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.ff_name, e.prize, e.kills, e.rank, t.title
  from public.tournament_entries e
  join public.tournaments t on t.id = e.tournament_id
  where e.prize > 0
  order by e.created_at desc
  limit 10
$$;

create or replace function public.leaderboard_top()
returns table (ff_name text, prize bigint, kills bigint)
language sql
stable
security definer
set search_path = public
as $$
  select min(e.ff_name) as ff_name, sum(e.prize)::bigint, sum(e.kills)::bigint
  from public.tournament_entries e
  group by lower(trim(e.ff_name))
  order by 2 desc, 3 desc
  limit 20
$$;

grant execute on function public.tournament_roster(uuid) to authenticated;
grant execute on function public.recent_winners() to authenticated, anon;
grant execute on function public.leaderboard_top() to authenticated, anon;
