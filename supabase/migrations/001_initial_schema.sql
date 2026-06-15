-- =====================================================
-- Gym Planner AI v2 — Supabase Schema + RLS
-- Run this in the Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- TABLE: user_memory
-- Stores all 4 memory layers per user (jsonb)
-- =====================================================
create table if not exists public.user_memory (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  hard_memory jsonb not null default '{}'::jsonb,
  soft_memory jsonb not null default '{}'::jsonb,
  emotional_memory jsonb not null default '{}'::jsonb,
  session_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- TABLE: chat_messages
-- Stores AI Coach conversation history (capped at 50 per user server-side)
-- =====================================================
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_id_created_at_idx 
  on public.chat_messages(user_id, created_at desc);

-- =====================================================
-- TABLE: food_logs
-- Daily food/macro entries
-- =====================================================
create table if not exists public.food_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  name text not null,
  calories integer not null default 0,
  protein_g numeric(6,1) not null default 0,
  carbs_g numeric(6,1) not null default 0,
  fat_g numeric(6,1) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists food_logs_user_date_idx 
  on public.food_logs(user_id, log_date desc);

-- =====================================================
-- TABLE: workout_schedules
-- AI-generated or user-created workout plans
-- =====================================================
create table if not exists public.workout_schedules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_schedules_user_id_idx 
  on public.workout_schedules(user_id);

-- =====================================================
-- TABLE: workout_logs
-- Daily "did I train today?" toggle
-- =====================================================
create table if not exists public.workout_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  trained boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  constraint workout_logs_user_date_unique unique (user_id, log_date)
);

create index if not exists workout_logs_user_date_idx 
  on public.workout_logs(user_id, log_date desc);

-- =====================================================
-- TABLE: weight_logs
-- Weight history for BMI tracking
-- =====================================================
create table if not exists public.weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  weight_kg numeric(5,1) not null,
  created_at timestamptz not null default now(),
  constraint weight_logs_user_date_unique unique (user_id, log_date)
);

create index if not exists weight_logs_user_date_idx 
  on public.weight_logs(user_id, log_date desc);

-- =====================================================
-- TABLE: feedback
-- User ratings and messages
-- =====================================================
create table if not exists public.feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  message text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- =====================================================
alter table public.user_memory enable row level security;
alter table public.chat_messages enable row level security;
alter table public.food_logs enable row level security;
alter table public.workout_schedules enable row level security;
alter table public.workout_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.feedback enable row level security;

-- =====================================================
-- RLS POLICIES — user_memory
-- =====================================================
create policy "Users can view their own memory"
  on public.user_memory for select
  using (auth.uid() = user_id);

create policy "Users can insert their own memory"
  on public.user_memory for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own memory"
  on public.user_memory for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own memory"
  on public.user_memory for delete
  using (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES — chat_messages
-- =====================================================
create policy "Users can view their own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES — food_logs
-- =====================================================
create policy "Users can view their own food logs"
  on public.food_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own food logs"
  on public.food_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own food logs"
  on public.food_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own food logs"
  on public.food_logs for delete
  using (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES — workout_schedules
-- =====================================================
create policy "Users can view their own schedules"
  on public.workout_schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert their own schedules"
  on public.workout_schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own schedules"
  on public.workout_schedules for update
  using (auth.uid() = user_id);

create policy "Users can delete their own schedules"
  on public.workout_schedules for delete
  using (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES — workout_logs
-- =====================================================
create policy "Users can view their own workout logs"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout logs"
  on public.workout_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workout logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES — weight_logs
-- =====================================================
create policy "Users can view their own weight logs"
  on public.weight_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own weight logs"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own weight logs"
  on public.weight_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own weight logs"
  on public.weight_logs for delete
  using (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES — feedback
-- =====================================================
create policy "Users can view their own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

create policy "Users can insert feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- =====================================================
-- TRIGGER: auto-update updated_at on user_memory
-- =====================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_memory_updated_at
  before update on public.user_memory
  for each row execute procedure public.handle_updated_at();

create trigger workout_schedules_updated_at
  before update on public.workout_schedules
  for each row execute procedure public.handle_updated_at();

-- =====================================================
-- NOTE: After running this migration, go to:
-- Supabase Dashboard → Authentication → Settings
-- → Disable "Enable email confirmations" for faster testing
-- =====================================================
