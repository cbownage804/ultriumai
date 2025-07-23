-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =========================
-- Enums
-- =========================
do $$
begin
    if not exists (select 1 from pg_type where typname = 'device_status') then
        create type device_status as enum ('online','offline','stale','unknown');
    end if;
    if not exists (select 1 from pg_type where typname = 'command_status') then
        create type command_status as enum ('queued','running','done','error','expired');
    end if;
end$$;

-- =========================
-- Core Tables
-- =========================

-- Organizations / Clients
create table if not exists public.organizations (
    id              uuid primary key default gen_random_uuid(),
    connector_key   text not null unique,
    client_code     text not null unique,
    client_name     text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists organizations_connector_key_idx on public.organizations(connector_key);

-- Devices
create table if not exists public.devices (
    id              uuid primary key default gen_random_uuid(),
    org_id          uuid not null references public.organizations(id) on delete cascade,
    hostname        text,
    ip_address      text,
    domain          text,
    agent_version   text,
    status          device_status not null default 'unknown',
    last_checkin    timestamptz,
    last_scan_at    timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists devices_org_id_idx on public.devices(org_id);
create index if not exists devices_last_checkin_idx on public.devices(last_checkin);

-- Device Checkins (history)
create table if not exists public.device_checkins (
    id              uuid primary key default gen_random_uuid(),
    device_id       uuid not null references public.devices(id) on delete cascade,
    payload         jsonb not null,
    created_at      timestamptz not null default now()
);

create index if not exists device_checkins_device_id_idx on public.device_checkins(device_id);

-- Scans
create table if not exists public.device_scans (
    id              uuid primary key default gen_random_uuid(),
    device_id       uuid not null references public.devices(id) on delete cascade,
    scan_type       text not null,
    network_ranges  text[] default array[]::text[],
    devices_found   integer,
    scan_duration   numeric,
    results         jsonb,
    created_at      timestamptz not null default now()
);

create index if not exists device_scans_device_id_idx on public.device_scans(device_id);
create index if not exists device_scans_created_at_idx on public.device_scans(created_at);

-- Commands Queue
create table if not exists public.device_commands (
    id              uuid primary key default gen_random_uuid(),
    device_id       uuid not null references public.devices(id) on delete cascade,
    type            text not null,
    payload         jsonb default '{}'::jsonb,
    status          command_status not null default 'queued',
    queued_at       timestamptz not null default now(),
    started_at      timestamptz,
    finished_at     timestamptz,
    result          jsonb,
    error_message   text
);

create index if not exists device_commands_device_id_status_idx on public.device_commands(device_id, status);
create index if not exists device_commands_status_idx on public.device_commands(status);

-- Short‑lived tray tokens (optional store for audit / revocation)
create table if not exists public.tray_tokens (
    id              uuid primary key default gen_random_uuid(),
    device_id       uuid not null references public.devices(id) on delete cascade,
    tool            text not null,          -- e.g. 'safepass'
    jwt             text not null,
    expires_at      timestamptz not null,
    created_at      timestamptz not null default now()
);

create index if not exists tray_tokens_device_id_idx on public.tray_tokens(device_id);
create index if not exists tray_tokens_expires_at_idx on public.tray_tokens(expires_at);

-- =========================
-- Helper functions (claims)
-- =========================

-- Extract a UUID claim named "device_id" from JWT (returns null if absent/invalid)
create or replace function public.current_device_id() returns uuid
language sql stable as $$
    select try_cast( nullif(current_setting('request.jwt.claim.device_id', true), '') as uuid );
$$;

-- Extract org_id claim if you mint such a claim for dashboard users
create or replace function public.current_org_id() returns uuid
language sql stable as $$
    select try_cast( nullif(current_setting('request.jwt.claim.org_id', true), '') as uuid );
$$;

-- Automatically keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger organizations_updated_at_tg
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger devices_updated_at_tg
before update on public.devices
for each row execute function public.set_updated_at();