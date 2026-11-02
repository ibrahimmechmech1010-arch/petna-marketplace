-- Allow the project owner to promote the first admin from the Supabase SQL Editor.
-- Authenticated users still cannot change their own role unless already admins.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'Only an administrator may change a profile role';
  end if;
  return new;
end;
$$;
