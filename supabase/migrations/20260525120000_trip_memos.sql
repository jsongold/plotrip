begin;

create table if not exists public.trip_memos (
  id                    uuid primary key default gen_random_uuid(),
  branch_id             uuid not null references branches(id) on delete cascade,
  after_destination_id  uuid references destinations(id) on delete cascade,
  url                   text not null,
  position              smallint not null default 0,
  created_at            timestamptz not null default now(),
  unique (branch_id, after_destination_id, position)
);

create index if not exists trip_memos_branch_idx
  on trip_memos (branch_id);

commit;
