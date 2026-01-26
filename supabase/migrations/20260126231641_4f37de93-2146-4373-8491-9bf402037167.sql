-- Only create conversations and messages tables (gpt_analytics already exists)
CREATE TABLE IF NOT EXISTS public.gpt_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gpt_id UUID NOT NULL REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gpt_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.gpt_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gpt_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gpt_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.gpt_conversations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.gpt_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.gpt_conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.gpt_conversations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.gpt_messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.gpt_conversations 
  WHERE id = gpt_messages.conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations" 
ON public.gpt_messages FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gpt_conversations 
  WHERE id = gpt_messages.conversation_id AND user_id = auth.uid()
));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gpt_conversations_user_gpt ON public.gpt_conversations(user_id, gpt_id);
CREATE INDEX IF NOT EXISTS idx_gpt_messages_conversation ON public.gpt_messages(conversation_id);

-- Update trigger
CREATE OR REPLACE TRIGGER update_gpt_conversations_updated_at
BEFORE UPDATE ON public.gpt_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();