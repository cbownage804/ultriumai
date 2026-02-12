
-- Provision MeshCentral assignment for UltriumLLC MSP → London server (least loaded)
INSERT INTO public.meshcentral_msp_assignments (msp_id, server_id, mesh_group_id, mesh_group_name, is_active)
VALUES (
  'c0218a57-24da-47ab-a4a7-dd95afd6867d',
  'ffa279b0-cd44-48a1-932b-28eb12a88bc8',
  'msp-c0218a57',
  'Vanguard - UltriumLLC',
  true
)
ON CONFLICT DO NOTHING;

-- Also provision the second MSP (My MSP) → NYC server
INSERT INTO public.meshcentral_msp_assignments (msp_id, server_id, mesh_group_id, mesh_group_name, is_active)
VALUES (
  '00af8271-8dfb-4027-bc58-ff10ffbdf479',
  '6bb109a6-8d95-485f-b979-c90c28cdbe55',
  'msp-00af8271',
  'Vanguard - My MSP',
  true
)
ON CONFLICT DO NOTHING;
