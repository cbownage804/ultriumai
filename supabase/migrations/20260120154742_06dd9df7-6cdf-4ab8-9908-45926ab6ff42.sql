-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Chat conversations public access" ON public.helpdesk_chat_conversations;

-- Create proper RLS policies for helpdesk_chat_conversations
-- Policy 1: MSP owners can view conversations for their clients
CREATE POLICY "MSP owners can view client conversations"
ON public.helpdesk_chat_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msps m ON m.id = mc.msp_id
    WHERE mc.id = helpdesk_chat_conversations.client_id
    AND m.user_id = auth.uid()
  )
);

-- Policy 2: MSP staff can view conversations for clients they have access to
CREATE POLICY "MSP staff can view client conversations"
ON public.helpdesk_chat_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msp_staff ms ON ms.msp_id = mc.msp_id
    WHERE mc.id = helpdesk_chat_conversations.client_id
    AND ms.user_id = auth.uid()
    AND ms.is_active = true
  )
);

-- Policy 3: Client users can view their own client's conversations
CREATE POLICY "Client users can view own conversations"
ON public.helpdesk_chat_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_users cu
    WHERE cu.client_id = helpdesk_chat_conversations.client_id
    AND cu.user_id = auth.uid()
    AND cu.is_active = true
  )
);

-- Policy 4: Users can view conversations matching their email
CREATE POLICY "Users can view own email conversations"
ON public.helpdesk_chat_conversations
FOR SELECT
TO authenticated
USING (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy 5: MSP owners can insert conversations for their clients
CREATE POLICY "MSP owners can insert client conversations"
ON public.helpdesk_chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msps m ON m.id = mc.msp_id
    WHERE mc.id = client_id
    AND m.user_id = auth.uid()
  )
);

-- Policy 6: MSP staff can insert conversations
CREATE POLICY "MSP staff can insert conversations"
ON public.helpdesk_chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msp_staff ms ON ms.msp_id = mc.msp_id
    WHERE mc.id = client_id
    AND ms.user_id = auth.uid()
    AND ms.is_active = true
  )
);

-- Policy 7: MSP owners can update their client conversations
CREATE POLICY "MSP owners can update client conversations"
ON public.helpdesk_chat_conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msps m ON m.id = mc.msp_id
    WHERE mc.id = helpdesk_chat_conversations.client_id
    AND m.user_id = auth.uid()
  )
);

-- Policy 8: MSP staff can update conversations
CREATE POLICY "MSP staff can update conversations"
ON public.helpdesk_chat_conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msp_staff ms ON ms.msp_id = mc.msp_id
    WHERE mc.id = helpdesk_chat_conversations.client_id
    AND ms.user_id = auth.uid()
    AND ms.is_active = true
  )
);