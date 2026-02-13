-- Revert server_url back to port 4430 (confirmed from MeshCentral web portal screenshot)
UPDATE meshcentral_servers 
SET server_url = 'https://138.68.128.58:4430/'
WHERE id = 'ffa279b0-cd44-48a1-932b-28eb12a88bc8';