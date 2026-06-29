import safepassLogo from "@/assets/safepass-logo.png";
import safescanLogo from "@/assets/safescan-logo.png";
import safewebLogo from "@/assets/safeweb-logo.png";
import safetrackLogo from "@/assets/safetrack-logo.png";
import safeassistLogo from "@/assets/safeassist-logo-horizontal.png";
import safesuiteLogo from "@/assets/safesuite-logo.png";

export { safesuiteLogo };

export const safeSuiteProducts = {
  safepass: {
    name: "Vault",
    logo: safepassLogo,
    description: "Zero-knowledge password vault with AES-256-GCM encryption and breach monitoring",
    features: ["600K PBKDF2 key derivation", "Built-in TOTP authenticator", "Password health dashboard"],
  },
  safescan: {
    name: "Scan",
    logo: safescanLogo,
    description: "Unified security scanner for emails, URLs, and documents with AI threat detection",
    features: ["Bulk scanning up to 50 items", "Scheduled recurring scans", "PDF/CSV reports"],
  },
  safeweb: {
    name: "Watch",
    logo: safewebLogo,
    description: "Breach database monitoring with AI-powered threat analysis and remediation guidance",
    features: ["Aggregated breach intelligence", "AI threat response plans", "Exposure risk scoring"],
  },
  safetrack: {
    name: "SafeTrack",
    logo: safetrackLogo,
    description: "IT asset lifecycle management with QR tracking and depreciation calculations",
    features: ["Hardware & software inventory", "Maintenance scheduling", "Compliance audit trails"],
  },
  safeassist: {
    name: "SafeAssist",
    logo: safeassistLogo,
    description: "AI-powered security assistant for plain-language guidance and threat analysis",
    features: ["ChatGPT-style interface", "File & email analysis", "Personalized security advice"],
  },
} as const;

export type WraythProductKey = keyof typeof safeSuiteProducts;

interface WraythProductIconProps {
  product: WraythProductKey;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showName?: boolean;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

export function WraythProductIcon({ 
  product, 
  size = "md", 
  className = "",
  showName = false 
}: WraythProductIconProps) {
  const productData = safeSuiteProducts[product];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={productData.logo} 
        alt={productData.name} 
        className={`${sizeClasses[size]} object-contain rounded-lg`}
      />
      {showName && (
        <span className="font-semibold text-foreground">{productData.name}</span>
      )}
    </div>
  );
}

export function WraythProductCard({ product }: { product: WraythProductKey }) {
  const productData = safeSuiteProducts[product];
  
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <img 
          src={productData.logo} 
          alt={productData.name} 
          className="h-12 w-12 object-contain rounded-lg"
        />
        <div>
          <h3 className="text-lg font-bold text-foreground">{productData.name}</h3>
          <p className="text-sm text-muted-foreground">{productData.description}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {productData.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
