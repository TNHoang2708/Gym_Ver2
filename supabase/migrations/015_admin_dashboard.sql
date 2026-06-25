-- Create user_roles table
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'user')) default 'user'
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Function to check if current user is admin (security definer bypasses RLS to prevent infinite recursion)
create or replace function public.is_admin() returns boolean as $$
declare
  admin_status boolean;
begin
  select (role = 'admin') into admin_status from public.user_roles where user_id = auth.uid();
  return coalesce(admin_status, false);
end;
$$ language plpgsql security definer set search_path = public;

-- Allow users to read their own role
create policy "Users can read own role"
  on public.user_roles for select
  using ( auth.uid() = user_id );

-- Allow admins to read all roles
create policy "Admins can view all roles"
  on public.user_roles for select
  using ( public.is_admin() );

-- Update user_memory policy to let admins see all users
create policy "Admins can view all user memory"
  on public.user_memory for select
  using ( public.is_admin() );

-- Assign admin role to a specific email (You can modify this email before running)
-- DO NOT RUN INSERT IF YOU DO NOT KNOW THE ID. 
-- Alternatively, after running this script, the admin can manually insert their user_id into user_roles.
