import { useLocation, Link } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Human-readable labels for route segments
const LABELS: Record<string, string> = {
  hub: "Product Hub",
  "ai-studio": "AI Studio",
  vanguard: "Vanguard",
  safesuite: "SafeSuite",
  safepass: "SafePass",
  safescan: "SafeScan",
  safeweb: "SafeWeb",
  safetrack: "SafeTrack",
  admin: "Admin Center",
  settings: "Settings",
  profile: "Profile",
  pricing: "Pricing",
  docs: "Documentation",
  contact: "Contact",
  auth: "Sign In",
  dashboard: "Dashboard",
  // Vanguard modules
  horizon: "Horizon",
  pursuit: "Pursuit",
  sentinel: "Sentinel",
  recon: "Recon",
  atlas: "Atlas",
  ledger: "Ledger",
  cortex: "Cortex",
  comply: "Comply",
  tickets: "Tickets",
  sites: "Sites",
  // AI Studio
  agents: "Agents",
  workflows: "Workflows",
  "app-builder": "App Builder",
  gpt: "GPTs",
  build: "Build",
  templates: "Templates",
  analytics: "Analytics",
  assistant: "Assistant",
  // SafePass
  security: "Security",
  import: "Import",
  "breach-monitor": "Breach Monitor",
  team: "Team",
  vault: "Vault",
  // Admin sub-pages
  helpdesk: "Helpdesk",
  reports: "Reports",
  // Common
  "use-cases": "Use Cases",
  "msp-control-center": "MSP Control Center",
};

// Routes where breadcrumbs should be hidden (home, landing, auth)
const HIDDEN_ROUTES = ["/", "/auth", "/auth/callback"];

function formatSegment(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  // Fallback: convert kebab-case to Title Case
  return segment
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function GlobalBreadcrumbs() {
  const location = useLocation();
  const { pathname } = location;

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // Build cumulative paths
  const crumbs = segments.map((seg, i) => ({
    label: formatSegment(seg),
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <Breadcrumb className="px-4 sm:px-6 lg:px-8 py-2 bg-muted/30 border-b border-border/30">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Home className="h-3.5 w-3.5" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {crumbs.map((crumb) => (
          <span key={crumb.path} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
