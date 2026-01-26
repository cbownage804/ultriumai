import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminAccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin (UltriumAI employee with CONFIRMED email)
      const isEmailConfirmed = user.email_confirmed_at != null;
      const isUltriumEmployee = user.email?.endsWith('@ultriumai.com');
      
      if (!isUltriumEmployee || !isEmailConfirmed) {
        toast({
          title: "Access Denied",
          description: !isEmailConfirmed 
            ? "Please confirm your email address first." 
            : "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      setUser(user);
    } catch (error) {
      console.error('Admin access check failed:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading, user };
};
