-- Delete duplicate threats, keeping only the most recent one per asset+title+source combination
DELETE FROM safeweb_threats 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY asset_id, title, source_name ORDER BY created_at DESC) as rn
    FROM safeweb_threats
  ) t 
  WHERE rn > 1
);