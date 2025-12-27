-- Create table for copilot conversation memory
CREATE TABLE public.copilot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for copilot messages
CREATE TABLE public.copilot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tools_used TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.copilot_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.copilot_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.copilot_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.copilot_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for messages (via conversation ownership)
CREATE POLICY "Users can view messages in their conversations" 
ON public.copilot_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.copilot_conversations c 
  WHERE c.id = conversation_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations" 
ON public.copilot_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.copilot_conversations c 
  WHERE c.id = conversation_id AND c.user_id = auth.uid()
));

-- Indexes
CREATE INDEX idx_copilot_conversations_user_id ON public.copilot_conversations(user_id);
CREATE INDEX idx_copilot_messages_conversation_id ON public.copilot_messages(conversation_id);

-- Trigger for updating conversation timestamp
CREATE TRIGGER update_copilot_conversations_updated_at
BEFORE UPDATE ON public.copilot_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();