-- Qualify repeated club names with their age category in every consumer.
update public.teams
set data = jsonb_set(
  jsonb_set(
    data,
    '{name}',
    to_jsonb(
      regexp_replace(data->>'name', '\s+H(10|12|14)$', '', 'i')
      || ' '
      || upper(data->>'category')
    )
  ),
  '{shortName}',
  to_jsonb(
    regexp_replace(data->>'shortName', '\s+H(10|12|14)$', '', 'i')
    || ' '
    || upper(data->>'category')
  )
);
