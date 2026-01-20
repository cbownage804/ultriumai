import safepassLogo from "@/assets/safepass-logo.png";
import safescanLogo from "@/assets/safescan-logo.png";
import safewebLogo from "@/assets/safeweb-logo.png";
import safetrackLogo from "@/assets/safetrack-logo.png";

export const safeSuiteProducts = {
  safepass: {
    name: "SafePass",
    logo: safepassLogo,
    description: "Secure password manager with military-grade encryption",
    features: ["Zero-knowledge architecture", "Auto-fill & sync", "Password generator"],
  },
  safescan: {
    name: "SafeScan",
    logo: safescanLogo,
    description: "Real-time email, URL, and document security scanning",
    features: ["Phishing detection", "Malware analysis", "Threat intelligence"],
  },
  safeweb: {
    name: "SafeWeb",
    logo: safewebLogo,
    description: "Dark web monitoring and breach alerts",
    features: ["24/7 monitoring", "Instant alerts", "Breach remediation"],
  },
  safetrack: {
    name: "SafeTrack",
    logo: safetrackLogo,
    description: "Asset management and inventory tracking",
    features: ["Device tracking", "License management", "Depreciation reports"],
  },
} as const;

export type SafeSuiteProductKey = keyof typeof safeSuiteProducts;

interface SafeSuiteProductIconProps {
  product: SafeSuiteProductKey;
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

export function SafeSuiteProductIcon({ 
  product, 
  size = "md", 
  className = "",
  showName = false 
}: SafeSuiteProductIconProps) {
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

export function SafeSuiteProductCard({ product }: { product: SafeSuiteProductKey }) {
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
