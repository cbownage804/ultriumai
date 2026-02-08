
-- Seed changelog data directly (bypasses RLS via migration)
INSERT INTO public.platform_changelog (version, title, description, entry_type, published, published_at) VALUES
('v2.5.0', 'Public Changelog Page', 'A dedicated changelog page showing all platform updates in a versioned timeline.', 'feature', true, '2026-02-08'),
('v2.5.0', 'Feature Request Board', 'Submit ideas, upvote existing requests, and track their status from planning to shipped.', 'feature', true, '2026-02-08'),
('v2.5.0', 'System Status Banner', 'Real-time incident and maintenance banners displayed globally when active.', 'feature', true, '2026-02-08'),
('v2.5.0', 'Referral Program', 'Invite friends, track conversions, and earn credits through your unique referral link.', 'feature', true, '2026-02-08'),
('v2.4.0', 'Admin Analytics Dashboard', 'Comprehensive admin metrics including DAU/MAU, product adoption, and activation funnels.', 'feature', true, '2026-02-07'),
('v2.4.0', 'Contextual Upgrade Prompts', 'Smart banners that appear when approaching credit limits or encountering gated features.', 'improvement', true, '2026-02-07'),
('v2.4.0', 'Page Transition Animations', 'Smooth Framer Motion transitions between all routes for a polished navigation experience.', 'improvement', true, '2026-02-07'),
('v2.3.5', 'Webhook Manager', 'Configure outbound webhooks with retry logic and event filtering from the Admin Center.', 'feature', true, '2026-02-06'),
('v2.3.5', 'Global Command Palette', 'Press Cmd+K to search across 35+ routes, actions, and settings instantly.', 'feature', true, '2026-02-06'),
('v2.3.5', 'What''s New Sidebar', 'A sparkle indicator in the header opens a slide-over with recent platform updates.', 'improvement', true, '2026-02-06'),
('v2.3.4', 'OOM Build Fix', 'Resolved out-of-memory build errors with aggressive bundle splitting and lazy loading.', 'fix', true, '2026-02-05'),
('v2.3.4', 'Session Replay Stability', 'Fixed edge case where session insights would show stale data after token refresh.', 'fix', true, '2026-02-05');
