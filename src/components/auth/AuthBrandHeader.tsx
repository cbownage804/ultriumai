import heroWrayth from "@/assets/hero-safesuite.jpg";
import { safesuiteLogo } from "@/components/safesuite/WraythProductIcons";

export function AuthBrandHeader() {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-card/40">
      {/* Hero background */}
      <div className="absolute inset-0">
        <img
          src={heroWrayth}
          alt="Abstract cybersecurity background"
          className="h-full w-full object-cover opacity-40"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Brand */}
      <div className="relative px-8 py-8 text-center">
        <div className="mx-auto flex items-center justify-center">
          <img
            src={safesuiteLogo}
            alt="Wrayth"
            className="h-16 w-auto object-contain"
            loading="eager"
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Your complete security solution
        </p>
      </div>
    </header>
  );
}
