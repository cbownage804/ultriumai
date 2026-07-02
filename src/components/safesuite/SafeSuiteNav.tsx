import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import wraythBrand from '@/assets/wrayth-brand-full.png.asset.json';

export default function WraythNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <img src={wraythBrand.url} alt="Wrayth — AI Security Companion" className="h-10 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Platform</Link>
          <Link to="/features#enterprise" className="text-muted-foreground hover:text-foreground transition-colors">Enterprise</Link>
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Resources</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/dashboard')}>Home</Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate('/'); }}>Sign Out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
              <Button size="sm" onClick={() => navigate('/auth?mode=signup')}>Get Started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
