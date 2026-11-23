-- Run once in Supabase SQL Editor. Existing records are preserved.
begin;
alter table public.resource_access drop constraint if exists resource_access_provider_check;
alter table public.resource_access add constraint resource_access_provider_check
check (provider in ('Amazon', 'ResearchGate', 'Article PDF'));
alter table public.resource_access drop constraint if exists resource_access_resource_url_check;
alter table public.resource_access add constraint resource_access_resource_url_check
check (
 (provider in ('Amazon', 'ResearchGate') and resource_url ~ '^https://(www\.)?(amazon\.com|researchgate\.net)/')
 or (provider = 'Article PDF' and resource_url ~ '^https://johnughulu\.com/articles/[a-z0-9-]+/$')
);
drop policy if exists "anonymous visitors may submit access records" on public.resource_access;
create policy "anonymous visitors may submit access records"
on public.resource_access for insert to anon
with check (
 privacy_consent = true and (
 (provider = 'Amazon' and resource_url ~ '^https://(www\.)?amazon\.com/')
 or (provider = 'ResearchGate' and resource_url ~ '^https://(www\.)?researchgate\.net/')
 or (provider = 'Article PDF' and resource_url ~ '^https://johnughulu\.com/articles/[a-z0-9-]+/$')
 )
);
commit;
