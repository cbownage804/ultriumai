import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-20">
      <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>© {new Date().getFullYear()} Wrayth. All rights reserved.</div>
        <nav className="flex gap-4">
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/features" className="hover:text-foreground">Features</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/security" className="hover:text-foreground">Security</Link>
        </nav>
      </div>
    </footer>
  );
}
