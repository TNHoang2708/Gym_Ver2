-- Create Social Tables
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE SET NULL,
  ai_summary TEXT NOT NULL,
  volume_lifted NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Posts RLS
CREATE POLICY "Public can view all posts"
ON public.posts FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
USING (auth.uid() = user_id);

-- Likes RLS
CREATE POLICY "Public can view all likes"
ON public.post_likes FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own likes"
ON public.post_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.post_likes FOR DELETE
USING (auth.uid() = user_id);

-- Comments RLS
CREATE POLICY "Public can view all comments"
ON public.post_comments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own comments"
ON public.post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE
USING (auth.uid() = user_id);
