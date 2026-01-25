-- Fix signup trigger failure: setup_user_subscription_defaults() uses ON CONFLICT(user_id)
-- but subscription_notifications lacked a unique constraint on user_id.

ALTER TABLE public.subscription_notifications
ADD CONSTRAINT subscription_notifications_user_id_unique UNIQUE (user_id);