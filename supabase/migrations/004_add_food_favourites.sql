-- =====================================================
-- Migration 004: Add Food Favourites
-- Run this in your Supabase SQL Editor
-- =====================================================

create table if not exists public.food_favourites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  created_at timestamptz not null default now(),
  constraint food_favourites_user_name_unique unique (user_id, name)
);

alter table public.food_favourites enable row level security;

create policy "Users can view their own food favourites"
  on public.food_favourites for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own food favourites"
  on public.food_favourites for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own food favourites"
  on public.food_favourites for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own food favourites"
  on public.food_favourites for delete
  using ( auth.uid() = user_id );

-- Done!
SELECT 'Migration 004 complete ✅' as status;
