-- Create safepass_notes table for secure notes
CREATE TABLE IF NOT EXISTS public.safepass_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safepass_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notes
CREATE POLICY "Users can view their own notes" 
ON public.safepass_notes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.safepass_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.safepass_notes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.safepass_notes FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for notes timestamp updates
CREATE TRIGGER update_safepass_notes_updated_at
BEFORE UPDATE ON public.safepass_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create safepass_cards table for credit cards
CREATE TABLE IF NOT EXISTS public.safepass_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  holder_name TEXT NOT NULL,
  last_four TEXT NOT NULL,
  card_type TEXT DEFAULT 'credit',
  encrypted_data TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safepass_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cards
CREATE POLICY "Users can view their own cards" 
ON public.safepass_cards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cards" 
ON public.safepass_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" 
ON public.safepass_cards FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" 
ON public.safepass_cards FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for cards timestamp updates
CREATE TRIGGER update_safepass_cards_updated_at
BEFORE UPDATE ON public.safepass_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();