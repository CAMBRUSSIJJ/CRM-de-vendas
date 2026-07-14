-- RealTalent CRM V99.0 — Supabase multiusuário com isolamento por workspace (tenant).
-- Execute este arquivo no SQL Editor de um projeto Supabase novo.

begin;

create extension if not exists pgcrypto;

create table if not exists public.crm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_memberships (
  tenant_id uuid not null references public.crm_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id,user_id)
);

create table if not exists public.crm_records (
  tenant_id uuid not null references public.crm_tenants(id) on delete cascade,
  record_key text not null check (char_length(record_key) between 1 and 240),
  value jsonb not null default 'null'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id,record_key)
);

create index if not exists crm_records_tenant_updated_idx
  on public.crm_records(tenant_id,updated_at desc);
create index if not exists crm_memberships_user_idx
  on public.crm_memberships(user_id,tenant_id);

create or replace function public.crm_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.crm_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.crm_profiles(id,display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.crm_is_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.crm_memberships m
     where m.tenant_id = p_tenant_id
       and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.crm_is_admin(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.crm_memberships m
     where m.tenant_id = p_tenant_id
       and m.user_id = (select auth.uid())
       and m.role in ('owner','admin')
  );
$$;

create or replace function public.crm_is_owner(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.crm_memberships m
     where m.tenant_id = p_tenant_id
       and m.user_id = (select auth.uid())
       and m.role = 'owner'
  );
$$;

create or replace function public.crm_can_write(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.crm_memberships m
     where m.tenant_id = p_tenant_id
       and m.user_id = (select auth.uid())
       and m.role in ('owner','admin','member')
  );
$$;

create or replace function public.crm_guard_tenant_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Workspace ownership cannot be changed directly';
  end if;
  return new;
end;
$$;

create or replace function public.crm_guard_membership_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner_count integer;
  v_primary_owner uuid;
begin
  if tg_op = 'INSERT' then
    if new.role = 'owner' then
      select owner_id into v_primary_owner
        from public.crm_tenants
       where id = new.tenant_id;
      if v_uid is null or (v_primary_owner is distinct from v_uid and not public.crm_is_owner(new.tenant_id)) then
        raise exception 'Only a workspace owner can grant the owner role';
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.tenant_id is distinct from old.tenant_id or new.user_id is distinct from old.user_id then
      raise exception 'Membership identity cannot be changed';
    end if;
    if (old.role = 'owner' or new.role = 'owner') and not public.crm_is_owner(old.tenant_id) then
      raise exception 'Only a workspace owner can change an owner membership';
    end if;
    if old.role = 'owner' and new.role <> 'owner' then
      select count(*) into v_owner_count
        from public.crm_memberships
       where tenant_id = old.tenant_id and role = 'owner';
      if v_owner_count <= 1 then
        raise exception 'A workspace must keep at least one owner';
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    -- A cascade caused by deleting the tenant itself must not be blocked.
    if not exists (select 1 from public.crm_tenants where id = old.tenant_id) then
      return old;
    end if;
    if old.role = 'owner' then
      if not public.crm_is_owner(old.tenant_id) then
        raise exception 'Only a workspace owner can remove an owner membership';
      end if;
      select count(*) into v_owner_count
        from public.crm_memberships
       where tenant_id = old.tenant_id and role = 'owner';
      if v_owner_count <= 1 then
        raise exception 'A workspace must keep at least one owner';
      end if;
    end if;
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.crm_create_tenant(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_tenant_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(coalesce(p_name,''))) < 2 then
    raise exception 'Workspace name is required';
  end if;

  insert into public.crm_tenants(name,owner_id)
  values (trim(p_name),v_user_id)
  returning id into v_tenant_id;

  insert into public.crm_memberships(tenant_id,user_id,role)
  values (v_tenant_id,v_user_id,'owner');

  return v_tenant_id;
end;
$$;

-- Triggers idempotentes.
drop trigger if exists crm_on_auth_user_created on auth.users;
create trigger crm_on_auth_user_created
after insert on auth.users
for each row execute procedure public.crm_handle_new_user();

drop trigger if exists crm_profiles_touch_updated_at on public.crm_profiles;
create trigger crm_profiles_touch_updated_at
before update on public.crm_profiles
for each row execute procedure public.crm_touch_updated_at();

drop trigger if exists crm_tenants_touch_updated_at on public.crm_tenants;
create trigger crm_tenants_touch_updated_at
before update on public.crm_tenants
for each row execute procedure public.crm_touch_updated_at();

drop trigger if exists crm_tenants_guard_owner on public.crm_tenants;
create trigger crm_tenants_guard_owner
before update on public.crm_tenants
for each row execute procedure public.crm_guard_tenant_update();

drop trigger if exists crm_memberships_guard_change on public.crm_memberships;
create trigger crm_memberships_guard_change
before insert or update or delete on public.crm_memberships
for each row execute procedure public.crm_guard_membership_change();

drop trigger if exists crm_records_touch_updated_at on public.crm_records;
create trigger crm_records_touch_updated_at
before update on public.crm_records
for each row execute procedure public.crm_touch_updated_at();

alter table public.crm_profiles enable row level security;
alter table public.crm_tenants enable row level security;
alter table public.crm_memberships enable row level security;
alter table public.crm_records enable row level security;

-- Políticas idempotentes.
drop policy if exists crm_profiles_select_own on public.crm_profiles;
drop policy if exists crm_profiles_update_own on public.crm_profiles;
drop policy if exists crm_tenants_select_member on public.crm_tenants;
drop policy if exists crm_tenants_update_admin on public.crm_tenants;
drop policy if exists crm_tenants_delete_owner on public.crm_tenants;
drop policy if exists crm_memberships_select_member on public.crm_memberships;
drop policy if exists crm_memberships_insert_admin on public.crm_memberships;
drop policy if exists crm_memberships_update_admin on public.crm_memberships;
drop policy if exists crm_memberships_delete_admin on public.crm_memberships;
drop policy if exists crm_records_select_member on public.crm_records;
drop policy if exists crm_records_insert_writer on public.crm_records;
drop policy if exists crm_records_update_writer on public.crm_records;
drop policy if exists crm_records_delete_writer on public.crm_records;

create policy crm_profiles_select_own on public.crm_profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy crm_profiles_update_own on public.crm_profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy crm_tenants_select_member on public.crm_tenants
for select to authenticated
using (public.crm_is_member(id));

create policy crm_tenants_update_admin on public.crm_tenants
for update to authenticated
using (public.crm_is_admin(id))
with check (public.crm_is_admin(id));

create policy crm_tenants_delete_owner on public.crm_tenants
for delete to authenticated
using (owner_id = (select auth.uid()));

create policy crm_memberships_select_member on public.crm_memberships
for select to authenticated
using (public.crm_is_member(tenant_id));

create policy crm_memberships_insert_admin on public.crm_memberships
for insert to authenticated
with check (
  public.crm_is_admin(tenant_id)
  and (role <> 'owner' or public.crm_is_owner(tenant_id))
);

create policy crm_memberships_update_admin on public.crm_memberships
for update to authenticated
using (public.crm_is_admin(tenant_id))
with check (
  public.crm_is_admin(tenant_id)
  and (role <> 'owner' or public.crm_is_owner(tenant_id))
);

create policy crm_memberships_delete_admin on public.crm_memberships
for delete to authenticated
using (public.crm_is_admin(tenant_id));

create policy crm_records_select_member on public.crm_records
for select to authenticated
using (public.crm_is_member(tenant_id));

create policy crm_records_insert_writer on public.crm_records
for insert to authenticated
with check (
  public.crm_can_write(tenant_id)
  and (updated_by is null or updated_by = (select auth.uid()))
);

create policy crm_records_update_writer on public.crm_records
for update to authenticated
using (public.crm_can_write(tenant_id))
with check (
  public.crm_can_write(tenant_id)
  and (updated_by is null or updated_by = (select auth.uid()))
);

create policy crm_records_delete_writer on public.crm_records
for delete to authenticated
using (public.crm_can_write(tenant_id));

revoke all on public.crm_profiles,public.crm_tenants,public.crm_memberships,public.crm_records from anon;
revoke all on function public.crm_create_tenant(text) from public,anon;
revoke all on function public.crm_is_member(uuid) from public,anon;
revoke all on function public.crm_is_admin(uuid) from public,anon;
revoke all on function public.crm_is_owner(uuid) from public,anon;
revoke all on function public.crm_can_write(uuid) from public,anon;
revoke all on function public.crm_guard_tenant_update() from public,anon,authenticated;
revoke all on function public.crm_guard_membership_change() from public,anon,authenticated;

grant select,update on public.crm_profiles to authenticated;
grant select,update,delete on public.crm_tenants to authenticated;
grant select,insert,update,delete on public.crm_memberships to authenticated;
grant select,insert,update,delete on public.crm_records to authenticated;
grant execute on function public.crm_create_tenant(text) to authenticated;
grant execute on function public.crm_is_member(uuid) to authenticated;
grant execute on function public.crm_is_admin(uuid) to authenticated;
grant execute on function public.crm_is_owner(uuid) to authenticated;
grant execute on function public.crm_can_write(uuid) to authenticated;

commit;
