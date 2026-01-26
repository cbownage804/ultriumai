-- Add category column to custom_gpts table for template categorization
ALTER TABLE public.custom_gpts 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add template_id column to track which template was used (if any)
ALTER TABLE public.custom_gpts 
ADD COLUMN IF NOT EXISTS template_id TEXT;

-- Add features column for template-specific features
ALTER TABLE public.custom_gpts 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_custom_gpts_category ON public.custom_gpts(category);

-- Comment on new columns
COMMENT ON COLUMN public.custom_gpts.category IS 'Category of the GPT template (e.g., IT Support, Financial Services, Legal)';
COMMENT ON COLUMN public.custom_gpts.template_id IS 'ID of the original template this GPT was created from';
COMMENT ON COLUMN public.custom_gpts.features IS 'Array of feature tags for this GPT';