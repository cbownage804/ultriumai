-- Upsert device by connector_key + hostname (used by checkin function)
create or replace function public.upsert_device_from_checkin(
    p_connector_key text,
    p_client_code   text,
    p_system_info   jsonb,
    p_agent_version text
) returns uuid
language plpgsql
as $$
declare
    v_org_id uuid;
    v_device_id uuid;
begin
    select id into v_org_id
    from public.organizations
    where connector_key = p_connector_key
       or client_code   = p_client_code
    limit 1;

    if v_org_id is null then
        raise exception 'Unknown organization (connector_key %, client_code %)', p_connector_key, p_client_code;
    end if;

    select id into v_device_id
    from public.devices
    where org_id = v_org_id
      and hostname = coalesce(p_system_info->>'hostname','')
    limit 1;

    if v_device_id is null then
        insert into public.devices(org_id, hostname, ip_address, domain, agent_version, status, last_checkin)
        values (
            v_org_id,
            p_system_info->>'hostname',
            p_system_info->>'ip_address',
            p_system_info->>'domain',
            p_agent_version,
            'online',
            now()
        )
        returning id into v_device_id;
    else
        update public.devices
        set ip_address   = p_system_info->>'ip_address',
            domain       = p_system_info->>'domain',
            agent_version= p_agent_version,
            status       = 'online',
            last_checkin = now()
        where id = v_device_id;
    end if;

    return v_device_id;
end;
$$;