-- SafeAssist Conversations table for chat history
CREATE TABLE public.safeassist_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- SafeAssist Messages table
CREATE TABLE public.safeassist_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.safeassist_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update safesuite_usage constraint to include safeassist
ALTER TABLE public.safesuite_usage DROP CONSTRAINT IF EXISTS safesuite_usage_product_check;
ALTER TABLE public.safesuite_usage ADD CONSTRAINT safesuite_usage_product_check 
  CHECK (product IN ('safepass', 'safescan', 'safeweb', 'safetrack', 'safeassist'));

-- Enable RLS
ALTER TABLE public.safeassist_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safeassist_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON public.safeassist_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.safeassist_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.safeassist_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.safeassist_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages"
  ON public.safeassist_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
  ON public.safeassist_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_safeassist_conversations_user ON public.safeassist_conversations(user_id, updated_at DESC);
CREATE INDEX idx_safeassist_messages_conversation ON public.safeassist_messages(conversation_id, created_at);

-- Trigger to update conversation updated_at
CREATE OR REPLACE FUNCTION public.update_safeassist_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.safeassist_conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.safeassist_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_safeassist_conversation_timestamp();