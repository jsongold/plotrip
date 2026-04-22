-- Transform: staging_climate_all_cities → city_monthly (aggregated monthly normals)
-- Resolves city_id via _city.name → catalog_cities.name
-- Usage: supabase db query -f scripts/transform_climate.sql

insert into city_monthly (city_id, month, avg_high_c, avg_low_c, precip_mm, updated_at)
select
  c.id as city_id,
  extract(month from d.dt)::smallint as month,
  round(avg(d.t_max)::numeric, 2)::real as avg_high_c,
  round(avg(d.t_min)::numeric, 2)::real as avg_low_c,
  round(
    (sum(d.precip) / nullif(count(distinct extract(year from d.dt)), 0))::numeric,
    2
  )::real as precip_mm,
  now()
from staging_climate_all_cities r
join catalog_cities c on lower(c.name) = lower(r.payload->'_city'->>'name'),
lateral (
  select
    (elem.value)::date as dt,
    (r.payload->'daily'->'temperature_2m_max'->>(elem.ordinality::int - 1))::real as t_max,
    (r.payload->'daily'->'temperature_2m_min'->>(elem.ordinality::int - 1))::real as t_min,
    (r.payload->'daily'->'precipitation_sum'->>(elem.ordinality::int - 1))::real as precip
  from jsonb_array_elements_text(r.payload->'daily'->'time') with ordinality as elem(value, ordinality)
) d
group by c.id, extract(month from d.dt)
on conflict (city_id, month) do update set
  avg_high_c = excluded.avg_high_c,
  avg_low_c  = excluded.avg_low_c,
  precip_mm  = excluded.precip_mm,
  updated_at = excluded.updated_at;
