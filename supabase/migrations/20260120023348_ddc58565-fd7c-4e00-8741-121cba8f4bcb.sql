-- Manually insert the subscription that failed to sync via webhook
INSERT INTO safesuite_subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_price_id,
  tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  'b8cfe427-6c70-456c-a793-2279f9ddae40',
  'sub_1SrUc3H1u6E0bsJT9FdDXSP0',
  'cus_Tp8tBHBZOX4Juo',
  'price_1SrTegH1u6E0bsJTKpGm5qxr',
  'pro',
  'active',
  '2026-01-20T02:24:07Z',
  '2026-02-20T02:24:07Z',
  false,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  cancel_at_period_end = EXCLUDED.cancel_at_period_end,
  updated_at = now();