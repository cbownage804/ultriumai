-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge base tables for document management and processing

-- Knowledge sources table
CREATE TABLE public.knowledge_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gpt_id UUID REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'url', 'website', 'api', 'database')),
  source_url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error', 'syncing')),
  auto_sync BOOLEAN DEFAULT false,
  sync_frequency TEXT DEFAULT 'manual' CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  file_count INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  sync_settings JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge documents table
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_url TEXT,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  processed_content TEXT,
  raw_content TEXT,
  content_hash TEXT,
  page_count INTEGER,
  word_count INTEGER,
  chunk_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  processing_settings JSONB DEFAULT '{}',
  error_message TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge chunks table for vector embeddings
CREATE TABLE public.knowledge_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  token_count INTEGER,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Web crawl jobs table
CREATE TABLE public.web_crawl_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_url TEXT NOT NULL,
  max_pages INTEGER DEFAULT 10,
  max_depth INTEGER DEFAULT 3,
  allowed_domains TEXT[],
  exclude_patterns TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error', 'cancelled')),
  pages_crawled INTEGER DEFAULT 0,
  pages_found INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  crawl_settings JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crawled pages table
CREATE TABLE public.crawled_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crawl_job_id UUID NOT NULL REFERENCES public.web_crawl_jobs(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  raw_html TEXT,
  status_code INTEGER,
  content_type TEXT,
  content_length INTEGER,
  depth INTEGER DEFAULT 0,
  parent_url TEXT,
  links_found TEXT[],
  metadata JSONB DEFAULT '{}',
  crawled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Search queries table for analytics
CREATE TABLE public.knowledge_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gpt_id UUID REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT DEFAULT 'semantic' CHECK (search_type IN ('semantic', 'keyword', 'hybrid')),
  results_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawled_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_sources
CREATE POLICY "Users can manage their own knowledge sources" 
ON public.knowledge_sources FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for knowledge_documents
CREATE POLICY "Users can manage their own knowledge documents" 
ON public.knowledge_documents FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for knowledge_chunks
CREATE POLICY "Users can access their own knowledge chunks" 
ON public.knowledge_chunks FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage knowledge chunks" 
ON public.knowledge_chunks FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own knowledge chunks" 
ON public.knowledge_chunks FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own knowledge chunks" 
ON public.knowledge_chunks FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for web_crawl_jobs
CREATE POLICY "Users can manage their own crawl jobs" 
ON public.web_crawl_jobs FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for crawled_pages
CREATE POLICY "Users can view their own crawled pages" 
ON public.crawled_pages FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage crawled pages" 
ON public.crawled_pages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own crawled pages" 
ON public.crawled_pages FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own crawled pages" 
ON public.crawled_pages FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for knowledge_searches
CREATE POLICY "Users can view their own search history" 
ON public.knowledge_searches FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create search entries" 
ON public.knowledge_searches FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_knowledge_sources_user_id ON public.knowledge_sources(user_id);
CREATE INDEX idx_knowledge_sources_gpt_id ON public.knowledge_sources(gpt_id);
CREATE INDEX idx_knowledge_sources_status ON public.knowledge_sources(status);
CREATE INDEX idx_knowledge_sources_sync ON public.knowledge_sources(auto_sync, next_sync_at);

CREATE INDEX idx_knowledge_documents_source_id ON public.knowledge_documents(source_id);
CREATE INDEX idx_knowledge_documents_user_id ON public.knowledge_documents(user_id);
CREATE INDEX idx_knowledge_documents_status ON public.knowledge_documents(status);
CREATE INDEX idx_knowledge_documents_content_hash ON public.knowledge_documents(content_hash);

CREATE INDEX idx_knowledge_chunks_document_id ON public.knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_chunks_source_id ON public.knowledge_chunks(source_id);
CREATE INDEX idx_knowledge_chunks_user_id ON public.knowledge_chunks(user_id);

-- Vector similarity search index for embeddings
CREATE INDEX idx_knowledge_chunks_embedding ON public.knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_web_crawl_jobs_source_id ON public.web_crawl_jobs(source_id);
CREATE INDEX idx_web_crawl_jobs_user_id ON public.web_crawl_jobs(user_id);
CREATE INDEX idx_web_crawl_jobs_status ON public.web_crawl_jobs(status);

CREATE INDEX idx_crawled_pages_crawl_job_id ON public.crawled_pages(crawl_job_id);
CREATE INDEX idx_crawled_pages_user_id ON public.crawled_pages(user_id);
CREATE INDEX idx_crawled_pages_url ON public.crawled_pages(url);

CREATE INDEX idx_knowledge_searches_user_id ON public.knowledge_searches(user_id);
CREATE INDEX idx_knowledge_searches_gpt_id ON public.knowledge_searches(gpt_id);
CREATE INDEX idx_knowledge_searches_created_at ON public.knowledge_searches(created_at);

-- Add triggers for updated_at columns
CREATE TRIGGER update_knowledge_sources_updated_at
BEFORE UPDATE ON public.knowledge_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_documents_updated_at
BEFORE UPDATE ON public.knowledge_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_web_crawl_jobs_updated_at
BEFORE UPDATE ON public.web_crawl_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for knowledge documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('knowledge-documents', 'knowledge-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for knowledge documents
CREATE POLICY "Users can upload their own knowledge documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'knowledge-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own knowledge documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'knowledge-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own knowledge documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'knowledge-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own knowledge documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'knowledge-documents' AND auth.uid()::text = (storage.foldername(name))[1]);