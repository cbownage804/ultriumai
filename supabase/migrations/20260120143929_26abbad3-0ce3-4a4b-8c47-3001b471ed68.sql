-- Create safepass_identities table for storing form fill profiles
CREATE TABLE IF NOT EXISTS public.safepass_identities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safepass_identities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view their own identities" 
ON public.safepass_identities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own identities" 
ON public.safepass_identities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own identities" 
ON public.safepass_identities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own identities" 
ON public.safepass_identities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_safepass_identities_updated_at
BEFORE UPDATE ON public.safepass_identities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();