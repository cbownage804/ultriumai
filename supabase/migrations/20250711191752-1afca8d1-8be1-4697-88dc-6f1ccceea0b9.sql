-- Create contact_messages table for contact form submissions (if not exists)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create blog_posts table for blog content (if not exists)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  category TEXT,
  tags TEXT[],
  featured_image TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on new tables (if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'contact_messages'
  ) THEN
    ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts'
  ) THEN
    ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for contact messages (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'contact_messages' 
    AND policyname = 'Anyone can insert contact messages'
  ) THEN
    CREATE POLICY "Anyone can insert contact messages" 
    ON public.contact_messages 
    FOR INSERT 
    WITH CHECK (true);
  END IF;
END $$;

-- Create RLS policies for blog posts (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Everyone can view published blog posts'
  ) THEN
    CREATE POLICY "Everyone can view published blog posts" 
    ON public.blog_posts 
    FOR SELECT 
    USING (published = true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Authors can manage their own blog posts'
  ) THEN
    CREATE POLICY "Authors can manage their own blog posts" 
    ON public.blog_posts 
    FOR ALL 
    USING (author_id = auth.uid());
  END IF;
END $$;