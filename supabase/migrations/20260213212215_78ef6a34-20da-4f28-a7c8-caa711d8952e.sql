-- Update MeshCentral config to match actual server values from screenshot
-- mesh_group_id from Group Identifier, server port from 4430 to 443
UPDATE meshcentral_msp_assignments 
SET mesh_group_id = 'E998231AB74B9C5776834BEA281F90B8FEC6A2374D'
WHERE msp_id = 'c0218a57-24da-47ab-a4a7-dd95afd6867d';

UPDATE meshcentral_servers 
SET server_url = 'https://138.68.128.58:443/'
WHERE id = 'ffa279b0-cd44-48a1-932b-28eb12a88bc8';