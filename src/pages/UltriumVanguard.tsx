import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This page now redirects to the Vanguard subdomain
const UltriumVanguard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're on the main ultriumai.com domain — redirect to app domain
    const isMainDomain = window.location.hostname === 'ultriumai.com' || 
                         window.location.hostname === 'www.ultriumai.com';
    
    if (isMainDomain) {
      // Redirect to the app domain vanguard route
      window.location.href = 'https://ultriumai.app/vanguard';
    } else {
      // In development or preview, navigate to the vanguard route
      navigate('/vanguard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Vanguard...</p>
      </div>
    </div>
  );
};

export default UltriumVanguard;
