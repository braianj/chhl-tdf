-- November 29 fixture transcribed from the tournament flyer.
with entries(category, club, name) as (
  values
    ('h10', 'cau', 'CAU'), ('h10', 'dragones', 'Dragones'), ('h10', 'vikingos', 'Vikingos'),
    ('h12', 'cau', 'CAU'), ('h12', 'dragones', 'Dragones'), ('h12', 'nires', 'Ñires'),
    ('h14', 'cau', 'CAU'), ('h14', 'dragones', 'Dragones'), ('h14', 'nires', 'Ñires'), ('h14', 'vikingos', 'Vikingos')
)
insert into public.teams (id, data)
select category || '-' || club, jsonb_build_object(
  'id', category || '-' || club, 'category', category, 'name', name, 'shortName', name
) from entries
on conflict (id) do nothing;

with schedule(number, category, starts, home, away) as (
  values
    (1, 'h14', '09:00', 'dragones', 'vikingos'),
    (2, 'h14', '09:33', 'cau', 'nires'),
    (3, 'h10', '10:06', 'dragones', 'vikingos'),
    (4, 'h12', '10:39', 'cau', 'nires'),
    (5, 'h14', '11:12', 'dragones', 'nires'),
    (6, 'h14', '11:45', 'cau', 'vikingos'),
    (7, 'h10', '12:18', 'cau', 'dragones'),
    (8, 'h12', '12:51', 'dragones', 'nires'),
    (9, 'h14', '13:24', 'cau', 'dragones'),
    (10, 'h14', '13:57', 'nires', 'vikingos'),
    (11, 'h10', '14:30', 'cau', 'vikingos'),
    (12, 'h12', '15:03', 'cau', 'dragones'),
    (13, 'h14', '15:36', null, null),
    (14, 'h10', '16:09', null, null),
    (15, 'h12', '16:42', null, null)
), slots as (
  select *, 'chhl-2026-' || lpad(number::text, 2, '0') as id from schedule
)
insert into public.matches (id, data)
select id, jsonb_build_object(
  'id', id, 'category', category, 'startDateTime', '2026-11-29T' || starts || ':00-03:00',
  'stage', case when home is null then 'final' else 'regular' end,
  'homeScore', null, 'awayScore', null, 'countsForStandings', home is not null,
  'status', case when home is null then 'tbd' else 'upcoming' end
) || case when home is null then jsonb_build_object('homeLabel', '1.º', 'awayLabel', '2.º')
  else jsonb_build_object('homeTeamId', category || '-' || home, 'awayTeamId', category || '-' || away) end
from slots
on conflict (id) do nothing;
