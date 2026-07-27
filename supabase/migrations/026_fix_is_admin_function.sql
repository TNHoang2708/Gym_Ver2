-- Revert is_admin function to check user_roles to prevent infinite recursion
create or replace function public.is_admin() returns boolean as $$
declare
  admin_status boolean;
begin
  select (role = 'admin') into admin_status from public.user_roles where user_id = auth.uid();
  return coalesce(admin_status, false);
end;
$$ language plpgsql security definer set search_path = public;
