-- Enable RLS and create policies for the new RMM schema
-- This migration addresses the RLS security warnings

-- Enable RLS
alter table public.organizations   enable row level security;
alter table public.devices         enable row level security;
alter table public.device_checkins enable row level security;
alter table public.device_scans    enable row level security;
alter table public.device_commands enable row level security;
alter table public.tray_tokens     enable row level security;

-- =========================
-- Policies
-- We assume three "actors":
--  1) Service role (supabase internal key) -> bypass RLS automatically.
--  2) Dashboard users: JWT has org_id claim.
--  3) Device/Tray: JWT has device_id claim.
-- =========================

-- ORGANIZATIONS
-- Dashboard users can read their org row
create policy org_select_self on public.organizations
for select using (
    current_org_id() is not null
    and id = current_org_id()
);

-- DEVICES
-- Dashboard users: full access to devices in their org
create policy devices_dash_select on public.devices
for select using (
    current_org_id() is not null
    and org_id = current_org_id()
);

create policy devices_dash_update on public.devices
for update using (
    current_org_id() is not null
    and org_id = current_org_id()
);

-- Devices themselves: can select/update only their own row
create policy devices_self_select on public.devices
for select using (
    current_device_id() is not null
    and id = current_device_id()
);

create policy devices_self_update on public.devices
for update using (
    current_device_id() is not null
    and id = current_device_id()
);

-- DEVICE_CHECKINS
-- Dashboard users read all checkins for their org
create policy checkins_dash_select on public.device_checkins
for select using (
    current_org_id() is not null
    and device_id in (
        select id from public.devices where org_id = current_org_id()
    )
);

-- Device can insert its own checkins
create policy checkins_device_insert on public.device_checkins
for insert with check (
    current_device_id() is not null
    and device_id = current_device_id()
);

-- Device can read its own checkins (optional)
create policy checkins_device_select on public.device_checkins
for select using (
    current_device_id() is not null
    and device_id = current_device_id()
);

-- DEVICE_SCANS
-- Dashboard users: read scans for their org
create policy scans_dash_select on public.device_scans
for select using (
    current_org_id() is not null
    and device_id in (select id from public.devices where org_id = current_org_id())
);

-- Device: insert its own scans
create policy scans_device_insert on public.device_scans
for insert with check (
    current_device_id() is not null
    and device_id = current_device_id()
);

-- Device: read its own scans (optional)
create policy scans_device_select on public.device_scans
for select using (
    current_device_id() is not null
    and device_id = current_device_id()
);

-- DEVICE_COMMANDS
-- Dashboard users: create commands for devices in their org
create policy cmds_dash_insert on public.device_commands
for insert with check (
    current_org_id() is not null
    and device_id in (select id from public.devices where org_id = current_org_id())
);

-- Dashboard users: read all commands for their org
create policy cmds_dash_select on public.device_commands
for select using (
    current_org_id() is not null
    and device_id in (select id from public.devices where org_id = current_org_id())
);

-- Device: read only its queued/running commands
create policy cmds_device_select on public.device_commands
for select using (
    current_device_id() is not null
    and device_id = current_device_id()
);

-- Device: update status/result of its own commands
create policy cmds_device_update on public.device_commands
for update using (
    current_device_id() is not null
    and device_id = current_device_id()
);

-- TRAY_TOKENS  (mostly written by edge function; dashboard may view for audit)
create policy tray_tokens_dash_select on public.tray_tokens
for select using (
    current_org_id() is not null
    and device_id in (select id from public.devices where org_id = current_org_id())
);

create policy tray_tokens_device_select on public.tray_tokens
for select using (
    current_device_id() is not null
    and device_id = current_device_id()
);

create policy tray_tokens_device_insert on public.tray_tokens
for insert with check (
    current_device_id() is not null
    and device_id = current_device_id()
);