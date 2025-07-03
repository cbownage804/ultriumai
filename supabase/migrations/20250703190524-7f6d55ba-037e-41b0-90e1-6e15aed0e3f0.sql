-- Create custom_gpts table
CREATE TABLE public.custom_gpts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  chat_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_gpts ENABLE ROW LEVEL SECURITY;

-- Create policies for custom GPTs
CREATE POLICY "select_own_gpts" ON public.custom_gpts
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "insert_own_gpts" ON public.custom_gpts
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_gpts" ON public.custom_gpts
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "delete_own_gpts" ON public.custom_gpts
FOR DELETE
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_gpts_updated_at
BEFORE UPDATE ON public.custom_gpts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();