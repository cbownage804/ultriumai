import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-background mt-20">
      <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>© {year} Wrayth. Ray is always watching.</div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/features" className="hover:text-foreground">Features</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
            <Link to="/resources" className="hover:text-foreground">Documentation</Link>
            <Link to="/app/trust" className="hover:text-foreground">Trust Center</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/security" className="hover:text-foreground">Security</Link>
          </nav>
        </div>
        <div className="mt-6 pt-6 border-t border-border/60 text-center text-xs text-muted-foreground/80">
          Wrayth is a product operated by Ultrium AI.
        </div>
      </div>
    </footer>
  );
}
