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

alter table trip_memos enable row level security;

create policy "read_trip_memos_public"
  on trip_memos for select using (true);

create policy "insert_trip_memos_owner"
  on trip_memos for insert with check (
    exists (
      select 1 from branches
      join trips on trips.id = branches.trip_id
      where branches.id = trip_memos.branch_id
        and trips.user_id = auth.uid()
    )
  );

create policy "update_trip_memos_owner"
  on trip_memos for update
  using (
    exists (
      select 1 from branches
      join trips on trips.id = branches.trip_id
      where branches.id = trip_memos.branch_id
        and trips.user_id = auth.uid()
    )
  );

create policy "delete_trip_memos_owner"
  on trip_memos for delete
  using (
    exists (
      select 1 from branches
      join trips on trips.id = branches.trip_id
      where branches.id = trip_memos.branch_id
        and trips.user_id = auth.uid()
    )
  );

commit;
