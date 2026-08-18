-- PHASE 16.1 — READ-ONLY live booking-schema introspection.
-- Run in Supabase SQL Editor and copy only the single JSON result.
-- This reads PostgreSQL catalogs only: no business/customer rows, IDs, emails,
-- credentials or secrets are selected, and no database object is changed.

with candidate_tables as (
  select n.nspname as schema_name, c.relname as table_name, c.oid,
         c.relrowsecurity as rls_enabled,
         c.relforcerowsecurity as rls_forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and (
      c.relname in ('profiles', 'salons', 'organizations', 'organization_members', 'services')
      or c.relname ilike '%book%'
      or c.relname ilike '%appointment%'
      or c.relname ilike '%customer%'
      or c.relname ilike '%payment%'
    )
),
tables_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', table_name,
    'rls_enabled', rls_enabled,
    'rls_forced', rls_forced
  ) order by table_name), '[]'::jsonb) as value
  from candidate_tables
),
columns_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', c.table_name,
    'column', c.column_name,
    'position', c.ordinal_position,
    'data_type', c.data_type,
    'udt_name', c.udt_name,
    'nullable', c.is_nullable,
    'default', case
      when c.column_default ilike '%nextval%' then 'sequence'
      when c.column_default is null then null
      else c.column_default
    end
  ) order by c.table_name, c.ordinal_position), '[]'::jsonb) as value
  from information_schema.columns c
  join candidate_tables t on t.schema_name = c.table_schema and t.table_name = c.table_name
),
constraints_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', t.table_name,
    'name', con.conname,
    'type', con.contype,
    'definition', pg_get_constraintdef(con.oid, true)
  ) order by t.table_name, con.conname), '[]'::jsonb) as value
  from candidate_tables t
  join pg_constraint con on con.conrelid = t.oid
  where con.contype in ('p', 'u', 'f', 'c', 'x')
),
policies_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', p.tablename,
    'policy', p.policyname,
    'permissive', p.permissive,
    'roles', p.roles,
    'command', p.cmd,
    'using', p.qual,
    'check', p.with_check
  ) order by p.tablename, p.policyname), '[]'::jsonb) as value
  from pg_policies p
  join candidate_tables t on t.schema_name = p.schemaname and t.table_name = p.tablename
),
grants_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', g.table_name,
    'grantee', g.grantee,
    'privilege', g.privilege_type
  ) order by g.table_name, g.grantee, g.privilege_type), '[]'::jsonb) as value
  from information_schema.role_table_grants g
  join candidate_tables t on t.schema_name = g.table_schema and t.table_name = g.table_name
  where g.grantee in ('anon', 'authenticated')
),
functions_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'schema', n.nspname,
    'function', p.proname,
    'arguments', pg_get_function_identity_arguments(p.oid),
    'result', pg_get_function_result(p.oid),
    'security_definer', p.prosecdef
  ) order by n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)), '[]'::jsonb) as value
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private')
    and (
      p.proname ilike '%book%'
      or p.proname ilike '%appointment%'
      or p.proname ilike '%customer%'
      or p.proname ilike '%slot%'
      or p.proname in ('nexora_owner_salon_ids', 'can_manage_salon_settings')
    )
),
triggers_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', event_object_table,
    'trigger', trigger_name,
    'event', event_manipulation,
    'timing', action_timing,
    'statement', action_statement
  ) order by event_object_table, trigger_name, event_manipulation), '[]'::jsonb) as value
  from information_schema.triggers tr
  join candidate_tables t
    on t.schema_name = tr.event_object_schema and t.table_name = tr.event_object_table
)
select jsonb_pretty(jsonb_build_object(
  'tables', (select value from tables_json),
  'columns', (select value from columns_json),
  'constraints', (select value from constraints_json),
  'policies', (select value from policies_json),
  'grants', (select value from grants_json),
  'functions', (select value from functions_json),
  'triggers', (select value from triggers_json)
)) as phase_16_1_schema_report;
