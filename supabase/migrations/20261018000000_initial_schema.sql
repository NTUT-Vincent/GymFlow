-- GymFlow schema. Apply once using Supabase SQL Editor (or supabase db push).
-- All browser access uses a publishable key + authenticated JWT; NEVER use service_role in Next.js client.
create extension if not exists btree_gist;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'GymFlow 會員',
  email text,
  role text not null default 'member' check (role in ('member', 'staff', 'admin')),
  created_at timestamptz not null default now()
);

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  open_time text not null,
  close_time text not null,
  created_by uuid references auth.users(id) on delete set null
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  category text not null,
  zone text not null,
  status text not null default 'available'
    check (status in ('available', 'in_use', 'maintenance')),
  available_at timestamptz,
  utilization integer not null default 0 check (utilization between 0 and 100)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  member_name text not null,
  category text not null,
  start_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 15 and 240),
  max_delay_minutes integer not null default 0 check (max_delay_minutes between 0 and 240),
  priority integer not null default 1 check (priority between 1 and 5),
  status text not null default 'pending'
    check (status in ('pending', 'scheduled', 'cancelled')),
  equipment_id uuid references public.equipment(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.schedules (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  member_name text not null,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  equipment_name text not null,
  category text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  wait_minutes integer not null default 0 check (wait_minutes >= 0),
  constraint schedules_positive_interval check (end_at > start_at),
  constraint schedules_no_equipment_overlap exclude using gist (
    equipment_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
);

create index equipment_gym_idx on public.equipment(gym_id);
create index bookings_member_idx on public.bookings(member_id, start_at);
create index bookings_status_idx on public.bookings(status, gym_id);
create index schedules_member_idx on public.schedules(member_id, start_at);

-- Supabase Auth lifecycle creates a member profile. Users never set their own role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id, email, display_name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name', new.email, 'GymFlow 會員'),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('staff', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.gyms enable row level security;
alter table public.equipment enable row level security;
alter table public.bookings enable row level security;
alter table public.schedules enable row level security;

-- Explicit grants: even if a policy is accidentally loosened, anon has no table access.
revoke all on public.profiles, public.gyms, public.equipment, public.bookings, public.schedules
  from anon, authenticated;
grant select on public.profiles, public.gyms, public.equipment, public.bookings, public.schedules
  to authenticated;
grant insert, update, delete on public.gyms to authenticated;
grant insert, update, delete on public.equipment to authenticated;
grant insert on public.bookings to authenticated;
-- No direct schedule writes, booking status changes, or role writes from the browser.

create policy "profile own or staff read" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select public.is_staff()));

create policy "signed in gyms read" on public.gyms
for select to authenticated using (true);
create policy "admins create gyms" on public.gyms
for insert to authenticated with check ((select public.is_admin()));
create policy "admins edit gyms" on public.gyms
for update to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy "admins delete gyms" on public.gyms
for delete to authenticated using ((select public.is_admin()));

create policy "signed in equipment read" on public.equipment
for select to authenticated using (true);
create policy "staff create equipment" on public.equipment
for insert to authenticated with check ((select public.is_staff()));
create policy "staff edit equipment" on public.equipment
for update to authenticated using ((select public.is_staff()))
with check ((select public.is_staff()));
create policy "staff delete equipment" on public.equipment
for delete to authenticated using ((select public.is_staff()));

create policy "owner or staff read booking" on public.bookings
for select to authenticated
using (member_id = (select auth.uid()) or (select public.is_staff()));
create policy "member creates pending booking" on public.bookings
for insert to authenticated
with check (
  member_id = (select auth.uid())
  and status = 'pending'
  and equipment_id is null
  and priority = 1
);

create policy "owner or staff read schedule" on public.schedules
for select to authenticated
using (member_id = (select auth.uid()) or (select public.is_staff()));

-- Cancellation is atomic: mark booking cancelled and remove its assigned interval.
create or replace function public.cancel_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  booked public.bookings%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Login required'; end if;

  select * into booked from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  if booked.member_id <> (select auth.uid()) and not public.is_staff() then
    raise exception 'Not authorized';
  end if;
  if booked.status = 'cancelled' then return; end if;

  update public.bookings
  set status = 'cancelled', equipment_id = null
  where id = p_booking_id;
  delete from public.schedules where booking_id = p_booking_id;
end;
$$;

-- Server-side transaction checks that an optimizer result is still valid.
-- Exclusion constraint also blocks concurrent overlapping equipment bookings.
create or replace function public.commit_schedule_batch(p_schedules jsonb)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  item jsonb;
  booked public.bookings%rowtype;
  machine public.equipment%rowtype;
  proposed_start timestamptz;
  proposed_end timestamptz;
  assigned_count integer := 0;
begin
  if not public.is_staff() then raise exception 'Staff role required'; end if;
  if p_schedules is null or jsonb_typeof(p_schedules) <> 'array' then
    raise exception 'Expected a schedules array';
  end if;

  for item in select value from jsonb_array_elements(p_schedules) loop
    select * into booked from public.bookings
      where id = (item ->> 'booking_id')::uuid for update;
    if not found or booked.status <> 'pending' then
      raise exception 'Booking was already assigned, cancelled, or does not exist';
    end if;

    select * into machine from public.equipment
      where id = (item ->> 'equipment_id')::uuid for share;
    if not found or machine.gym_id <> booked.gym_id
       or machine.category <> booked.category
       or machine.status = 'maintenance' then
      raise exception 'Equipment mismatch or unavailable';
    end if;

    proposed_start := (item ->> 'start_at')::timestamptz;
    proposed_end := (item ->> 'end_at')::timestamptz;
    if proposed_start is null or proposed_end is null
       or proposed_start < booked.start_at
       or proposed_start > booked.start_at + make_interval(mins => booked.max_delay_minutes)
       or proposed_end <> proposed_start + make_interval(mins => booked.duration_minutes)
       or (machine.status = 'in_use' and
           (machine.available_at is null or proposed_start < machine.available_at))
    then
      raise exception 'Invalid schedule time or equipment availability';
    end if;

    insert into public.schedules (
      id, gym_id, booking_id, member_id, member_name,
      equipment_id, equipment_name, category, start_at, end_at, wait_minutes
    ) values (
      'schedule-' || booked.id::text, booked.gym_id, booked.id,
      booked.member_id, booked.member_name, machine.id, machine.name,
      booked.category, proposed_start, proposed_end,
      extract(epoch from (proposed_start - booked.start_at))::integer / 60
    );

    update public.bookings
    set status = 'scheduled', equipment_id = machine.id
    where id = booked.id;
    assigned_count := assigned_count + 1;
  end loop;

  return assigned_count;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.cancel_booking(uuid) from public, anon;
revoke all on function public.commit_schedule_batch(jsonb) from public, anon;
grant execute on function public.is_staff(), public.is_admin() to authenticated;
grant execute on function public.cancel_booking(uuid), public.commit_schedule_batch(jsonb)
to authenticated;

-- Optional live UI refresh (requires Realtime to be enabled for the project).
alter publication supabase_realtime add table public.gyms, public.equipment,
  public.bookings, public.schedules;

-- After your first Google sign-in, promote one known user in SQL Editor ONLY:
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';
