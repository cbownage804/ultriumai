import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { safesuiteLogo } from '@/components/safesuite/SafeSuiteProductIcons';

export default function WraythNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={safesuiteLogo} alt="Wrayth" className="h-8 w-auto" />
          <span className="font-bold text-lg">Wrayth</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/products/safepass" className="text-muted-foreground hover:text-foreground transition-colors">SafePass</Link>
          <Link to="/products/safescan" className="text-muted-foreground hover:text-foreground transition-colors">SafeScan</Link>
          <Link to="/products/safeweb" className="text-muted-foreground hover:text-foreground transition-colors">SafeWeb</Link>
          <Link to="/products/safetrack" className="text-muted-foreground hover:text-foreground transition-colors">SafeTrack</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/safesuite/dashboard')}>Dashboard</Button>
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
