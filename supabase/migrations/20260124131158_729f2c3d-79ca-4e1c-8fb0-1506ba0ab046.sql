-- Secure payment_transactions table - users can only access their own transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can insert their own payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can update their own payment transactions" 
ON public.payment_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Secure msp_clients table - MSP owners can only access their own clients
ALTER TABLE public.msp_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MSP owners can view their own clients" ON public.msp_clients;
CREATE POLICY "MSP owners can view their own clients" 
ON public.msp_clients 
FOR SELECT 
USING (auth.uid() = msp_id);

DROP POLICY IF EXISTS "MSP owners can insert their own clients" ON public.msp_clients;
CREATE POLICY "MSP owners can insert their own clients" 
ON public.msp_clients 
FOR INSERT 
WITH CHECK (auth.uid() = msp_id);

DROP POLICY IF EXISTS "MSP owners can update their own clients" ON public.msp_clients;
CREATE POLICY "MSP owners can update their own clients" 
ON public.msp_clients 
FOR UPDATE 
USING (auth.uid() = msp_id);

DROP POLICY IF EXISTS "MSP owners can delete their own clients" ON public.msp_clients;
CREATE POLICY "MSP owners can delete their own clients" 
ON public.msp_clients 
FOR DELETE 
USING (auth.uid() = msp_id);