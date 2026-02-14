import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as any;
      const redirectTo = searchParams.get("redirect_to") || "/auth/callback";

      if (!tokenHash || !type) {
        setError("Invalid confirmation link.");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (error) {
        console.error("Token verification failed:", error);
        setError(error.message);
        return;
      }

      // Parse redirectTo - if it's a full URL on our domain, extract the path
      try {
        const url = new URL(redirectTo);
        navigate(url.pathname + url.search, { replace: true });
      } catch {
        navigate(redirectTo, { replace: true });
      }
    };

    verify();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold text-destructive">Verification Failed</h1>
          <p className="text-muted-foreground">{error}</p>
          <a href="/auth" className="text-primary underline">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Verifying your email...</p>
      </div>
    </div>
  );
};

export default AuthConfirm;
