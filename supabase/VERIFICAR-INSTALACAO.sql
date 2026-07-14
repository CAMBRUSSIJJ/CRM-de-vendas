-- Execute após schema.sql. Todos os objetos devem existir e o RLS deve estar ativo.
select to_regclass('public.crm_profiles') as profiles,
       to_regclass('public.crm_tenants') as tenants,
       to_regclass('public.crm_memberships') as memberships,
       to_regclass('public.crm_records') as records;

select relname, relrowsecurity
from pg_class
where relname in ('crm_profiles','crm_tenants','crm_memberships','crm_records')
order by relname;

select proname
from pg_proc
where proname in ('crm_create_tenant','crm_is_member','crm_is_admin','crm_is_owner','crm_can_write','crm_touch_updated_at','crm_handle_new_user','crm_guard_tenant_update','crm_guard_membership_change')
order by proname;

select tablename, policyname, cmd
from pg_policies
where schemaname='public'
  and tablename in ('crm_profiles','crm_tenants','crm_memberships','crm_records')
order by tablename,policyname;


select event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema='public'
  and trigger_name in ('crm_tenants_guard_owner','crm_memberships_guard_change')
order by event_object_table,trigger_name,event_manipulation;
