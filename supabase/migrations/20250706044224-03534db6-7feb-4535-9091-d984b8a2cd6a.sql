-- Add foreign key constraint between safeweb_threats and safeweb_assets
ALTER TABLE safeweb_threats 
ADD CONSTRAINT fk_safeweb_threats_asset_id 
FOREIGN KEY (asset_id) 
REFERENCES safeweb_assets(id) 
ON DELETE CASCADE;