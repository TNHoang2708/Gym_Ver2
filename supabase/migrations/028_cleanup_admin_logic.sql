-- 028_cleanup_admin_logic.sql
-- Safely unifies the admin logic using a separate user_roles table to avoid infinite recursion

-- 1. Ensure user_roles table exists
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'user')) default 'user'
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- 2. Sync existing admins from user_memory (if any) to user_roles
insert into public.user_roles (user_id, role)
select user_id, 'admin' 
from public.user_memory 
where is_admin = true
on conflict (user_id) do update set role = 'admin';

-- 3. Update is_admin function to safely check user_roles
create or replace function public.is_admin() returns boolean as $$
declare
  admin_status boolean;
begin
  select (role = 'admin') into admin_status from public.user_roles where user_id = auth.uid();
  return coalesce(admin_status, false);
end;
$$ language plpgsql security definer set search_path = public;

-- 4. Re-create safe policies for user_roles
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
  
  create policy "Users can read own role" on public.user_roles for select using ( auth.uid() = user_id );
  create policy "Admins can view all roles" on public.user_roles for select using ( public.is_admin() );
END $$;

-- 5. Drop ANY old recursive admin policies
DROP POLICY IF EXISTS "Admins_Force_View_Memory" ON public.user_memory;
DROP POLICY IF EXISTS "Admins_Force_View_WorkoutLogs" ON public.workout_logs;
DROP POLICY IF EXISTS "Admins_Force_View_FoodLogs" ON public.food_logs;
DROP POLICY IF EXISTS "Admins_Force_View_Sessions" ON public.workout_session_logs;
DROP POLICY IF EXISTS "Admins can view all user memory" ON public.user_memory;

-- 6. Create NEW safe admin policies using the fixed function
CREATE POLICY "Admins_Force_View_Memory" ON public.user_memory FOR SELECT USING ( public.is_admin() );
CREATE POLICY "Admins_Force_View_WorkoutLogs" ON public.workout_logs FOR SELECT USING ( public.is_admin() );
CREATE POLICY "Admins_Force_View_FoodLogs" ON public.food_logs FOR SELECT USING ( public.is_admin() );
CREATE POLICY "Admins_Force_View_Sessions" ON public.workout_session_logs FOR SELECT USING ( public.is_admin() );
