import vaultLogo from "@/assets/vault-logo.png";
import scanLogo from "@/assets/scan-logo.png";
import watchLogo from "@/assets/watch-logo.png";
import wraythWordmark from "@/assets/wrayth-wordmark-v3.png";

export const safesuiteLogo = wraythWordmark;

export const safeSuiteProducts = {
  vault: {
    name: "Vault",
    logo: vaultLogo,
    description: "Zero-knowledge password vault with AES-256-GCM encryption and continuous breach monitoring.",
    features: [
      "600K PBKDF2 key derivation",
      "Built-in TOTP authenticator",
      "Password health dashboard",
    ],
  },
  scan: {
    name: "Scan",
    logo: scanLogo,
    description: "Unified email, URL, and file scanner with AI threat detection powered by Ray.",
    features: [
      "Bulk scanning up to 50 items",
      "Scheduled recurring scans",
      "PDF/CSV exportable reports",
    ],
  },
  watch: {
    name: "Watch",
    logo: watchLogo,
    description: "Identity and dark-web monitoring with AI remediation guidance from Ray.",
    features: [
      "Aggregated breach intelligence",
      "AI-generated response plans",
      "Personal exposure risk score",
    ],
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
