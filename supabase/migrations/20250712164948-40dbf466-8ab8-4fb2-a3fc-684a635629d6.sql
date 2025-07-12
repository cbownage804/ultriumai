-- Add Brandon Howard as a client admin for KWC CPAs
INSERT INTO client_users (user_id, client_id, role)
VALUES (
  '453c6d29-34db-4b1a-9f29-3ff7170ae765', -- Brandon Howard's user ID
  '8150dd72-23b2-4414-bad1-dbc9b18baacf', -- KWC CPAs client ID
  'client_admin'
);