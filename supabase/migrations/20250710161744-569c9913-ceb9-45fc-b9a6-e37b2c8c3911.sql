-- Create function to cleanup old document scans (keep only 20 most recent per user)
CREATE OR REPLACE FUNCTION cleanup_old_document_scans()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old scans for the user, keeping only the 20 most recent
  DELETE FROM document_scans 
  WHERE user_id = NEW.user_id 
  AND id NOT IN (
    SELECT id 
    FROM document_scans 
    WHERE user_id = NEW.user_id 
    ORDER BY created_at DESC 
    LIMIT 20
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically cleanup after each insert
CREATE TRIGGER trigger_cleanup_document_scans
  AFTER INSERT ON document_scans
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_document_scans();

-- Also create a similar cleanup function for gpt_analytics security scans
CREATE OR REPLACE FUNCTION cleanup_old_security_scans()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old security scans for the user, keeping only the 20 most recent
  DELETE FROM gpt_analytics 
  WHERE user_id = NEW.user_id 
  AND interaction_type = 'security_scan'
  AND id NOT IN (
    SELECT id 
    FROM gpt_analytics 
    WHERE user_id = NEW.user_id 
    AND interaction_type = 'security_scan'
    ORDER BY created_at DESC 
    LIMIT 20
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gpt_analytics security scans
CREATE TRIGGER trigger_cleanup_security_scans
  AFTER INSERT ON gpt_analytics
  FOR EACH ROW
  WHEN (NEW.interaction_type = 'security_scan')
  EXECUTE FUNCTION cleanup_old_security_scans();