-- Clean up any remaining Custom AI Agent references from platform plans
UPDATE pricing_plans 
SET features = jsonb_path_query_array(
  features, 
  '$[*] ? (@ like_regex "^(?!.*[Cc]ustom.*[Aa]gent|.*[Aa][Ii].*[Aa]gent|.*[Gg][Pp][Tt]).*$")'
)
WHERE category = 'platform';

-- Double check our current platform plans don't have any GPT/AI agent references
SELECT name, features FROM pricing_plans WHERE category = 'platform' ORDER BY monthly_price;