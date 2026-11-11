-- Apply in the Supabase SQL editor as the database owner before public release.
-- Keeps existing policies, but adds restrictive guards so permissive legacy
-- policies cannot grant access to another user's progress or dictionary writes.
begin;

alter table public.words enable row level security;
alter table public.user_word_progress enable row level security;

revoke all on public.words from anon, authenticated;
grant select on public.words to authenticated;
revoke all on public.user_word_progress from anon, authenticated;
grant select, insert, update, delete on public.user_word_progress to authenticated;

-- Restrictive policies also constrain privileges inherited through PUBLIC.
drop policy if exists alfaz_progress_owner_guard on public.user_word_progress;
create policy alfaz_progress_owner_guard on public.user_word_progress
  as restrictive for all to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists alfaz_progress_owner_access on public.user_word_progress;
create policy alfaz_progress_owner_access on public.user_word_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Shared content is maintained in the dashboard/service role, never by clients.
do $$
declare table_name text;
begin
  foreach table_name in array array['words', 'app_announcements'] loop
    if to_regclass('public.' || table_name) is null then continue; end if;
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('drop policy if exists alfaz_read on public.%I', table_name);
    execute format('create policy alfaz_read on public.%I for select to authenticated using (true)', table_name);
    execute format('drop policy if exists alfaz_read_guard on public.%I', table_name);
    execute format('create policy alfaz_read_guard on public.%I as restrictive for select to public using ((select auth.uid()) is not null)', table_name);
    execute format('drop policy if exists alfaz_no_insert on public.%I', table_name);
    execute format('create policy alfaz_no_insert on public.%I as restrictive for insert to public with check (false)', table_name);
    execute format('drop policy if exists alfaz_no_update on public.%I', table_name);
    execute format('create policy alfaz_no_update on public.%I as restrictive for update to public using (false) with check (false)', table_name);
    execute format('drop policy if exists alfaz_no_delete on public.%I', table_name);
    execute format('create policy alfaz_no_delete on public.%I as restrictive for delete to public using (false)', table_name);
  end loop;
end $$;
commit;
