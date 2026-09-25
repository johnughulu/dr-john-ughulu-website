-- Run once in Supabase SQL Editor after creating your administrator user.
-- Replace ADMIN_EMAIL_HERE with the email address used for that administrator.
drop policy if exists "Website administrator can read resource access" on public.resource_access;
create policy "Website administrator can read resource access"
on public.resource_access
for select
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email','')) = lower('ADMIN_EMAIL_HERE'));
