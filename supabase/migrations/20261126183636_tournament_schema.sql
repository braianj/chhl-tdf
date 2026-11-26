-- Keep tournament roles separate from public scoresheet data.
create table public.tournament_admins (
  email text primary key check (email = lower(btrim(email)) and position('@' in email) > 1),
  role text not null check (role in ('owner', 'editor'))
);

alter table public.tournament_admins enable row level security;
revoke all on public.tournament_admins from public, anon, authenticated;
grant select, insert, update, delete on public.tournament_admins to authenticated;

create function public.current_tournament_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select case when lower(u.email) = 'braianj@gmail.com' then 'owner' else a.role end
  from auth.users as u
  left join public.tournament_admins as a on a.email = lower(u.email)
  where u.id = auth.uid() and u.email_confirmed_at is not null
$$;

revoke all on function public.current_tournament_role() from public, anon, authenticated;
grant execute on function public.current_tournament_role() to authenticated;

create policy owners_manage_admins on public.tournament_admins
  for all to authenticated
  using ((select public.current_tournament_role()) = 'owner')
  with check ((select public.current_tournament_role()) = 'owner');

do $$
declare
  target text;
  allowed_roles text;
begin
  foreach target in array array['teams', 'matches', 'players', 'match_rosters', 'match_events'] loop
    execute format(
      'create table public.%I (
        id text primary key,
        data jsonb not null
          check (jsonb_typeof(data) = ''object''
            and data ? ''id'' and data->>''id'' = id
            and data ? ''category'' and data->>''category'' in (''h10'', ''h12'', ''h14''))
      )', target);
    execute format('alter table public.%I enable row level security', target);
    execute format('revoke all on public.%I from public, anon, authenticated', target);
    execute format('grant select on public.%I to anon, authenticated', target);
    execute format('create policy public_reads on public.%I for select to anon, authenticated using (true)', target);
    if target <> 'matches' then
      allowed_roles := case when target in ('match_rosters', 'match_events') then '(''owner'', ''editor'')' else '(''owner'')' end;
      execute format('grant insert, update, delete on public.%I to authenticated', target);
      execute format('create policy authorized_edits on public.%I for all to authenticated
        using ((select public.current_tournament_role()) in %s)
        with check ((select public.current_tournament_role()) in %s)', target, allowed_roles, allowed_roles);
    end if;
  end loop;
end
$$;

alter table public.players add constraint player_fields check (
  data - array['id', 'category', 'teamId', 'name', 'role', 'number', 'active'] = '{}'::jsonb
);
alter table public.match_rosters add constraint roster_fields check (
  data - array['id', 'category', 'matchId', 'teamId', 'playerId', 'playerName', 'jerseyNumber', 'saves', 'goalsAgainst', 'minutesPlayed'] = '{}'::jsonb
);
alter table public.match_events add constraint event_fields check (
  data - array['id', 'category', 'matchId', 'teamId', 'type', 'playerId', 'playerName', 'jerseyNumber', 'assistId', 'assistName', 'assistJerseyNumber', 'secondAssistId', 'secondAssistName', 'secondAssistJerseyNumber', 'period', 'gameTime', 'penaltyMinutes', 'notes'] = '{}'::jsonb
);

create function public.save_tournament_match(document jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  actor_role text := public.current_tournament_role();
  match_id text := document->>'id';
  previous jsonb;
  result_fields text[] := array['homeScore', 'awayScore', 'resolution', 'status', 'notes'];
begin
  if actor_role = 'owner' then
    insert into public.matches (id, data) values (match_id, document)
    on conflict (id) do update set data = excluded.data;
  elsif actor_role = 'editor' then
    select data into previous from public.matches where id = match_id for update;
    if not found or (previous - result_fields) is distinct from (document - result_fields) then
      raise exception 'An editor can only change results on existing matches' using errcode = '42501';
    end if;
    update public.matches set data = document where id = match_id;
  else
    raise exception 'Tournament access required' using errcode = '42501';
  end if;
end
$$;

revoke all on function public.save_tournament_match(jsonb) from public, anon, authenticated;
grant execute on function public.save_tournament_match(jsonb) to authenticated;
