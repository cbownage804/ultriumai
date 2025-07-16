-- Add DELETE policy for safenet_connectors table
CREATE POLICY "Users can delete their own connectors" 
ON public.safenet_connectors 
FOR DELETE 
USING (user_id = auth.uid());