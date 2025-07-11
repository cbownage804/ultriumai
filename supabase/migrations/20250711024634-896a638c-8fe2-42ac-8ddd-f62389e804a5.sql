-- Create web crawl jobs table
CREATE TABLE public.web_crawl_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  crawl_type TEXT NOT NULL DEFAULT 'scrape', -- 'scrape' or 'crawl'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  pages_found INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  job_id TEXT, -- External service job ID
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create knowledge documents table
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crawl_job_id UUID REFERENCES public.web_crawl_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  content_type TEXT DEFAULT 'text/html',
  word_count INTEGER DEFAULT 0,
  summary TEXT,
  topics TEXT[],
  importance_score INTEGER DEFAULT 50, -- 0-100 scale
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.web_crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for web_crawl_jobs
CREATE POLICY "Users can manage their own crawl jobs" ON public.web_crawl_jobs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "System can manage crawl jobs" ON public.web_crawl_jobs
  FOR ALL USING (true);

-- RLS policies for knowledge_documents
CREATE POLICY "Users can view their own knowledge documents" ON public.knowledge_documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own knowledge documents" ON public.knowledge_documents
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "System can manage knowledge documents" ON public.knowledge_documents
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_web_crawl_jobs_user_id ON public.web_crawl_jobs(user_id);
CREATE INDEX idx_web_crawl_jobs_status ON public.web_crawl_jobs(status);
CREATE INDEX idx_knowledge_documents_user_id ON public.knowledge_documents(user_id);
CREATE INDEX idx_knowledge_documents_url ON public.knowledge_documents(url);
CREATE INDEX idx_knowledge_documents_topics ON public.knowledge_documents USING GIN(topics);

-- Create updated_at trigger for web_crawl_jobs
CREATE TRIGGER update_web_crawl_jobs_updated_at
  BEFORE UPDATE ON public.web_crawl_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for knowledge_documents
CREATE TRIGGER update_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();