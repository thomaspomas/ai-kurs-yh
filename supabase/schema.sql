-- ============================================================
-- AI för yrkeshögskolan – Supabase schema
-- Kör detta i Supabase SQL Editor efter att projektet skapats
-- ============================================================

-- Profiles (synkroniseras med auth.users via trigger)
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  full_name  text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Module progress
create table if not exists public.module_progress (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade not null,
  module_id    integer not null,
  section_id   text not null,
  completed_at timestamptz default now(),
  unique(user_id, module_id, section_id)
);

alter table public.module_progress enable row level security;

drop policy if exists "Users can manage own progress" on public.module_progress;
drop policy if exists "Users can view own progress" on public.module_progress;

create policy "Users can view own progress"
  on public.module_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.module_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.module_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reflections
create table if not exists public.reflections (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users on delete cascade not null,
  module_id       integer not null,
  section_id      text not null,
  reflection_text text not null default '',
  ai_feedback     text not null default '',
  updated_at      timestamptz default now(),
  unique(user_id, module_id, section_id)
);

alter table public.reflections enable row level security;

drop policy if exists "Users can view own reflections" on public.reflections;

drop policy if exists "Users can insert own reflections" on public.reflections;

drop policy if exists "Users can update own reflections" on public.reflections;

create policy "Users can view own reflections"
  on public.reflections for select
  using (auth.uid() = user_id);

create policy "Users can insert own reflections"
  on public.reflections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reflections"
  on public.reflections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Exam submissions
create table if not exists public.exam_submissions (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade not null unique,
  part1        text not null default '',
  part2        text not null default '',
  part3        text not null default '',
  part4        text not null default '',
  approved     boolean not null default false,
  submitted_at timestamptz default now()
);

alter table public.exam_submissions enable row level security;

drop policy if exists "Users can manage own submission" on public.exam_submissions;
drop policy if exists "Users can view own submission" on public.exam_submissions;

create policy "Users can view own submission"
  on public.exam_submissions for select
  using (auth.uid() = user_id);

-- Diplomas
create table if not exists public.diplomas (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users on delete cascade not null unique,
  user_name         text not null,
  issued_at         timestamptz default now(),
  verification_code text unique not null
);

alter table public.diplomas enable row level security;

drop policy if exists "Users can view own diploma" on public.diplomas;
drop policy if exists "Users can insert own diploma" on public.diplomas;
drop policy if exists "Users can update own diploma" on public.diplomas;

create policy "Users can view own diploma"
  on public.diplomas for select
  using (auth.uid() = user_id);

-- Controlled writes
create or replace function public.complete_section(
  p_module_id integer,
  p_section_id text,
  p_reflection_text text default null,
  p_ai_feedback text default null
)
returns boolean
language plpgsql
security definer
set search_path = public,
    row_security = off
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_module_id < 1 or p_module_id > 8 then
    raise exception 'invalid_module';
  end if;

  if p_section_id is null or p_section_id !~ '^[a-z0-9_-]+$' then
    raise exception 'invalid_section';
  end if;

  insert into public.module_progress (user_id, module_id, section_id)
  values (v_user_id, p_module_id, p_section_id)
  on conflict (user_id, module_id, section_id) do nothing;

  if p_reflection_text is not null and length(trim(p_reflection_text)) >= 50 then
    insert into public.reflections (user_id, module_id, section_id, reflection_text, ai_feedback, updated_at)
    values (v_user_id, p_module_id, p_section_id, p_reflection_text, coalesce(p_ai_feedback, ''), now())
    on conflict (user_id, module_id, section_id) do update
      set reflection_text = excluded.reflection_text,
          ai_feedback = excluded.ai_feedback,
          updated_at = now();
  end if;

  return true;
end;
$$;

create or replace function public.submit_exam(
  p_part1 text,
  p_part2 text,
  p_part3 text,
  p_part4 text,
  p_user_name text,
  p_track text default null
)
returns boolean
language plpgsql
security definer
set search_path = public,
    row_security = off
as $$
declare
  v_user_id uuid := auth.uid();
  v_required_sections integer;
  v_completed_sections integer;
  v_verification_code text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if length(trim(coalesce(p_part1, ''))) < 200
    or length(trim(coalesce(p_part2, ''))) < 300
    or length(trim(coalesce(p_part3, ''))) < 200
    or length(trim(coalesce(p_part4, ''))) < 200 then
    raise exception 'exam_too_short';
  end if;

  v_required_sections := case lower(trim(coalesce(p_track, '')))
    when 'ai-grundkurs' then 48
    when 'utbildningsledare' then 55
    when 'yh-affarsutvecklare' then 48
    when 'yh-larare' then 54
    when 'yh-ledning' then 55
    when 'yh-studerande' then 54
    else raise exception 'invalid_track';
  end case;

  select count(*) into v_completed_sections
    from public.module_progress
    where user_id = v_user_id;

  if v_completed_sections < v_required_sections then
    raise exception 'modules_not_completed';
  end if;

  insert into public.exam_submissions (user_id, part1, part2, part3, part4, approved, submitted_at)
  values (v_user_id, p_part1, p_part2, p_part3, p_part4, true, now())
  on conflict (user_id) do update
    set part1 = excluded.part1,
        part2 = excluded.part2,
        part3 = excluded.part3,
        part4 = excluded.part4,
        approved = true,
        submitted_at = now();

  v_verification_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.diplomas (user_id, user_name, verification_code, issued_at)
  values (v_user_id, coalesce(nullif(trim(p_user_name), ''), 'Deltagare'), v_verification_code, now())
  on conflict (user_id) do nothing;

  return true;
end;
$$;

grant execute on function public.complete_section(integer, text, text, text) to authenticated;
grant execute on function public.submit_exam(text, text, text, text, text, text) to authenticated;
