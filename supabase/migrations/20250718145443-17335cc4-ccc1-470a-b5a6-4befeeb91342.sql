-- Update all connectors to use correct user ID
UPDATE safenet_connectors 
SET user_id = 'b8cfe427-6c70-456c-a793-2279f9ddae40' 
WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765';

-- Update any vulnerabilities data if table exists
UPDATE safenet_vulnerabilities 
SET user_id = 'b8cfe427-6c70-456c-a793-2279f9ddae40' 
WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765';