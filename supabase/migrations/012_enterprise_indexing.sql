-- ==========================================
-- 012_enterprise_indexing.sql
-- Description: Advanced indexing for enterprise scale (1000+ users).
-- This resolves slow queries on social feeds, auth joins, and frequent aggregations.
-- ==========================================

-- 1. Index for the Community Social Feed (Sorting by latest posts)
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);

-- 2. Index to quickly find a user's posts
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);

-- 3. Indexes to quickly count or fetch likes and comments for a specific post
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id);

-- 4. Index on API Telemetry for Admin Dashboard (Filtering by endpoint or user)
CREATE INDEX IF NOT EXISTS api_telemetry_user_id_idx ON public.api_telemetry(user_id);
CREATE INDEX IF NOT EXISTS api_telemetry_endpoint_idx ON public.api_telemetry(endpoint);
CREATE INDEX IF NOT EXISTS api_telemetry_timestamp_idx ON public.api_telemetry(created_at DESC);

-- 5. Index on User Memory for rapid AI context loading
-- (Though user_id is UNIQUE, an explicit index helps with some JOIN planners)
CREATE INDEX IF NOT EXISTS user_memory_user_id_idx ON public.user_memory(user_id);
