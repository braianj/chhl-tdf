alter table public.match_rosters drop constraint roster_fields;
alter table public.match_rosters add constraint roster_fields check (
  data - array[
    'id', 'category', 'matchId', 'teamId', 'playerId', 'playerName', 'jerseyNumber',
    'shotsPeriod1', 'shotsPeriod2', 'shotsOvertime', 'saves', 'goalsAgainst', 'minutesPlayed'
  ] = '{}'::jsonb
);

alter table public.teams add constraint team_fields check (
  data - array['id', 'category', 'name', 'shortName', 'color', 'logo', 'drawOrder'] = '{}'::jsonb
);
