import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, Key, Shield, Globe, Package, Scan, Mail, FileText, Link as LinkIcon,
  ChevronRight, ArrowLeft, BookOpen, HelpCircle, ListChecks, CheckCircle2,
  AlertTriangle, Lock, Users, Fingerprint, History, Brain, Eye, Clock,
  BarChart3, QrCode, Laptop, DollarSign, Calendar, Download, Settings, Sparkles
} from "lucide-react";
import { safeSuiteProducts, safesuiteLogo } from "@/components/safesuite/SafeSuiteProductIcons";

// Product branding config
const productBranding = {
  safepass: {
    gradient: "from-amber-500 to-orange-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-600 dark:text-amber-400",
    icon: "bg-amber-500",
  },
  safescan: {
    gradient: "from-red-500 to-rose-500",
    lightBg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-600 dark:text-red-400",
    icon: "bg-red-500",
  },
  safeweb: {
    gradient: "from-purple-500 to-violet-500",
    lightBg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-600 dark:text-purple-400",
    icon: "bg-purple-500",
  },
  safetrack: {
    gradient: "from-emerald-500 to-teal-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "bg-emerald-500",
  },
};

// SafeSuite Products Data
const products = [
  {
    id: "safepass",
    name: "SafePass",
    tagline: "Enterprise Password Management",
    icon: Key,
    logo: safeSuiteProducts.safepass.logo,
    branding: productBranding.safepass,
    articles: [
      {
        id: "safepass-getting-started",
        title: "Getting Started with SafePass",
        type: "guide",
        content: `
# Getting Started with SafePass

SafePass is your enterprise-grade password manager with zero-knowledge encryption.

## Step 1: Create Your Master Password
1. Navigate to **SafeSuite → SafePass** from the dashboard
2. Click **"Set Up SafePass"**
3. Create a strong master password (minimum 12 characters)
4. Store your recovery codes in a safe place

> ⚠️ **Important**: Your master password is never stored on our servers. If you lose it, you'll need your recovery codes.

## Step 2: Import Existing Passwords
1. Go to **Settings → Import**
2. Choose your source (Chrome, Firefox, LastPass, 1Password, etc.)
3. Upload your exported CSV file
4. Review and confirm the import

## Step 3: Install Browser Extension
1. Click **"Get Browser Extension"** in the SafePass dashboard
2. Install for your browser (Chrome, Firefox, Edge, Safari)
3. Sign in with your UltriumAI account
4. The extension will auto-fill passwords on websites

## Step 4: Enable Biometric Unlock (Mobile)
1. Download the UltriumAI mobile app
2. Go to **Settings → Security → Biometric Unlock**
3. Enable Face ID or Fingerprint
4. Confirm with your master password
        `
      },
      {
        id: "safepass-add-credentials",
        title: "Adding & Managing Credentials",
        type: "guide",
        content: `
# Adding & Managing Credentials

## Adding a New Password Entry
1. Click the **"+"** button in SafePass
2. Fill in the details:
   - **Title**: Name for the entry (e.g., "Work Email")
   - **Username**: Your login username or email
   - **Password**: Click 🎲 to generate a strong password
   - **URL**: Website address for auto-fill
   - **Notes**: Additional secure notes
3. Click **"Save Entry"**

## Organizing with Folders
1. Click **"New Folder"** in the sidebar
2. Name your folder (e.g., "Work", "Personal", "Banking")
3. Drag entries into folders or select folder when creating

## Sharing Credentials Securely
1. Open the credential you want to share
2. Click **"Share"** → **"Share with Team Member"**
3. Select the team member(s)
4. Choose permission level:
   - **View Only**: Can use but not see password
   - **Can Edit**: Full access to modify
   - **One-Time View**: Link expires after one view
5. Click **"Send Invitation"**

## Password Generator Settings
1. Go to **Settings → Password Generator**
2. Configure:
   - Length (recommended: 20+)
   - Include uppercase, lowercase, numbers, symbols
   - Avoid ambiguous characters
3. Save as default settings
        `
      },
      {
        id: "safepass-breach-monitoring",
        title: "Breach Monitoring & Alerts",
        type: "guide",
        content: `
# Breach Monitoring & Alerts

SafePass continuously monitors your credentials against known data breaches.

## How It Works
1. Your email addresses are hashed and checked against breach databases
2. We never transmit your actual passwords
3. Checks run automatically every 24 hours
4. Instant alerts when breaches are detected

## Viewing Breach Alerts
1. Go to **SafePass → Security Dashboard**
2. View the **"Breached Credentials"** section
3. Click on any alert to see details:
   - When the breach occurred
   - What data was exposed
   - Recommended actions

## Responding to a Breach
1. Click **"Change Password"** on the alert
2. Use the password generator for a new strong password
3. Update the credential on the actual website
4. Mark the alert as resolved

## Security Score
Your security score is calculated based on:
- Password strength (weak, reused, old passwords)
- Two-factor authentication status
- Breach exposure
- Password age

**Target Score**: 90+ for enterprise-grade security
        `
      }
    ],
    faqs: [
      {
        q: "What is zero-knowledge encryption?",
        a: "Zero-knowledge means your master password and vault data are encrypted on your device before being sent to our servers. We never have access to your decryption keys, so even we cannot read your passwords."
      },
      {
        q: "What happens if I forget my master password?",
        a: "Use your recovery codes to regain access. If you've lost those too, you'll need to reset your vault, which deletes all stored passwords. We recommend storing recovery codes in a physical safe or secure location."
      },
      {
        q: "Can I use SafePass offline?",
        a: "Yes! Your vault is cached locally and encrypted. You can access passwords offline, and changes will sync when you reconnect."
      },
      {
        q: "How do I share passwords with team members?",
        a: "Open any entry → Click Share → Select team members → Choose permission level (View Only, Can Edit, or One-Time). Shared passwords are end-to-end encrypted."
      },
      {
        q: "Is SafePass built with compliance in mind?",
        a: "SafePass is built with SOC 2, HIPAA, and GDPR principles in mind — including zero-knowledge encryption, comprehensive audit logging, and strict data isolation. While we are not yet formally certified, our architecture is designed to support your compliance requirements."
      }
    ]
  },
  {
    id: "safescan",
    name: "SafeScan",
    tagline: "AI-Powered Threat Scanner",
    icon: Scan,
    logo: safeSuiteProducts.safescan.logo,
    branding: productBranding.safescan,
    articles: [
      {
        id: "safescan-email-scanning",
        title: "Email Threat Scanning",
        type: "guide",
        content: `
# Email Threat Scanning

SafeScan's email scanner detects phishing, malware, and social engineering attacks.

## How to Scan an Email
1. Go to **SafeSuite → SafeScan → Email Scanner**
2. Paste the email content or upload an .eml file
3. Click **"Analyze Email"**
4. Review the threat assessment

## Understanding Results
- **Risk Score**: 0-100 (higher = more dangerous)
- **Threat Type**: Phishing, Malware, Spam, BEC, Safe
- **Indicators**: Specific red flags detected

### Red Flag Indicators
- 🚨 **Sender Spoofing**: Email claims to be from a different domain
- 🚨 **Urgency Tactics**: "Act now!", "Your account will be suspended"
- 🚨 **Suspicious Links**: URLs that don't match claimed destination
- 🚨 **Attachment Risks**: Executable files, macro-enabled documents
- 🚨 **Grammar/Spelling**: Unusual errors suggesting non-native speaker

## Automated Scanning
1. Go to **Settings → Integrations → Email**
2. Connect your email provider (Microsoft 365, Google Workspace)
3. Enable **"Auto-Scan Incoming Emails"**
4. Set action for detected threats:
   - Move to quarantine
   - Add warning banner
   - Block delivery
        `
      },
      {
        id: "safescan-document-scanning",
        title: "Document & File Scanning",
        type: "guide",
        content: `
# Document & File Scanning

Scan PDFs, Office files, and other documents for hidden threats.

## Supported File Types
- PDF documents
- Microsoft Office (Word, Excel, PowerPoint)
- OpenDocument formats
- Image files (for hidden data)
- Archives (ZIP, RAR)

## How to Scan Documents
1. Go to **SafeScan → Document Scanner**
2. Drag and drop files or click **"Upload"**
3. Wait for AI analysis (typically 5-30 seconds)
4. Review the security report

## What We Detect
- **Malicious Macros**: VBA code that executes harmful actions
- **Embedded Executables**: Hidden .exe files in documents
- **JavaScript Payloads**: Scripts in PDFs
- **Steganography**: Data hidden in images
- **Exploit Kits**: Known vulnerability exploits

## Batch Scanning
1. Select multiple files (up to 50 at once)
2. Click **"Batch Scan"**
3. View results in the scan history
4. Export report as PDF or CSV
        `
      },
      {
        id: "safescan-url-analysis",
        title: "URL & Link Analysis",
        type: "guide",
        content: `
# URL & Link Analysis

Check any URL for phishing, malware, and reputation issues.

## Quick URL Check
1. Go to **SafeScan → URL Analyzer**
2. Paste the URL you want to check
3. Click **"Analyze URL"**
4. View the safety report

## What We Analyze
- **Domain Age**: New domains are often malicious
- **SSL Certificate**: Valid HTTPS and certificate details
- **Reputation Databases**: Cross-check with known threat lists
- **Redirect Chain**: Track where the URL actually goes
- **Page Content**: AI analysis of the destination page
- **Similar Domains**: Typosquatting detection

## Browser Extension
With the SafeScan browser extension:
1. Hover over any link to see safety rating
2. Automatic blocking of known malicious sites
3. Real-time phishing page detection
4. Warning before entering credentials on suspicious sites
        `
      }
    ],
    faqs: [
      {
        q: "How accurate is the AI threat detection?",
        a: "SafeScan achieves 99.7% accuracy on known threats and 94% on zero-day attacks. Our AI models are trained on millions of threat samples and updated daily."
      },
      {
        q: "What file size limits apply?",
        a: "Individual files up to 50MB can be scanned. For larger files, use the API with chunked uploads or contact support for enterprise limits."
      },
      {
        q: "Does SafeScan store my scanned files?",
        a: "Files are processed in memory and deleted immediately after scanning. We only store metadata (file hash, scan results) for your history. You can disable history in settings."
      },
      {
        q: "Can I integrate SafeScan with my email server?",
        a: "Yes! We support Microsoft 365, Google Workspace, and any IMAP/SMTP server. API integrations are available for custom setups."
      }
    ]
  },
  {
    id: "safeweb",
    name: "SafeWeb",
    tagline: "Dark Web Intelligence",
    icon: Globe,
    logo: safeSuiteProducts.safeweb.logo,
    branding: productBranding.safeweb,
    articles: [
      {
        id: "safeweb-monitoring-setup",
        title: "Setting Up Dark Web Monitoring",
        type: "guide",
        content: `
# Setting Up Dark Web Monitoring

SafeWeb monitors the dark web 24/7 for your exposed credentials and data.

## Step 1: Add Monitored Assets
1. Go to **SafeSuite → SafeWeb → Monitoring**
2. Click **"Add Asset"**
3. Choose asset type:
   - **Email Addresses**: Personal or work emails
   - **Domains**: Your company domain
   - **Phone Numbers**: Mobile numbers
   - **Credit Cards**: Last 4 digits only (we never store full numbers)
4. Verify ownership (email confirmation or DNS record)

## Step 2: Configure Alerts
1. Go to **Settings → Notifications**
2. Enable alert channels:
   - Email notifications
   - SMS alerts (premium)
   - Slack/Teams integration
   - Push notifications (mobile app)
3. Set alert priority levels

## Step 3: Review Initial Scan
1. After adding assets, an initial scan runs automatically
2. Review any existing exposures in the **"Findings"** tab
3. Take action on critical items first
4. Mark resolved items as "Remediated"

## Understanding Severity Levels
- 🔴 **Critical**: Active credentials on sale, requires immediate action
- 🟠 **High**: Recent breach exposure, password change recommended
- 🟡 **Medium**: Older breach data, may be outdated
- 🟢 **Low**: Informational, no immediate risk
        `
      },
      {
        id: "safeweb-responding-breaches",
        title: "Responding to Breach Alerts",
        type: "guide",
        content: `
# Responding to Breach Alerts

When SafeWeb detects your data on the dark web, follow these steps.

## Immediate Actions
1. **Don't panic** - Most breaches contain old data
2. **Assess the exposure**:
   - What data was exposed? (email only, password, financial)
   - How recent is the breach?
   - Is the password still in use?

## For Password Exposures
1. Change the password immediately on the affected site
2. If you reused this password elsewhere, change it everywhere
3. Enable two-factor authentication
4. Use SafePass to generate unique passwords

## For Financial Data Exposures
1. Monitor your accounts for unauthorized transactions
2. Consider a credit freeze with major bureaus
3. Enable transaction alerts on your cards
4. Contact your bank's fraud department

## For Personal Information
1. Be alert for phishing attempts using this info
2. Consider identity monitoring services
3. Update security questions that use exposed data
4. Warn family members if shared info was exposed

## Marking as Resolved
1. After taking action, click **"Mark as Resolved"**
2. Add notes about what steps you took
3. The finding moves to your remediation history
4. Future scans won't re-alert on this specific finding
        `
      }
    ],
    faqs: [
      {
        q: "How does SafeWeb find data on the dark web?",
        a: "We deploy monitoring agents across dark web forums, marketplaces, and data dump sites. When data matching your monitored assets appears, we capture it and alert you—without exposing you to the dark web directly."
      },
      {
        q: "Is it legal to monitor the dark web?",
        a: "Yes. Monitoring publicly posted data for security purposes is legal. We don't engage in illegal activities; we passively observe and report findings."
      },
      {
        q: "How quickly will I be alerted?",
        a: "Typically within 24-48 hours of data appearing on known dark web sources. Critical exposures (active sales) trigger immediate alerts."
      },
      {
        q: "Can I monitor my entire organization?",
        a: "Yes! Enterprise plans allow domain-wide monitoring for all employee emails, plus executive protection with additional monitoring services."
      }
    ]
  },
  {
    id: "safetrack",
    name: "SafeTrack",
    tagline: "Asset Lifecycle Management",
    icon: Package,
    logo: safeSuiteProducts.safetrack.logo,
    branding: productBranding.safetrack,
    articles: [
      {
        id: "safetrack-adding-assets",
        title: "Adding & Managing IT Assets",
        type: "guide",
        content: `
# Adding & Managing IT Assets

SafeTrack helps you track all IT equipment from purchase to retirement.

## Adding an Asset Manually
1. Go to **SafeSuite → SafeTrack → Assets**
2. Click **"Add Asset"**
3. Fill in details:
   - **Asset Name**: Descriptive name (e.g., "MacBook Pro - John Smith")
   - **Category**: Laptop, Desktop, Monitor, etc.
   - **Serial Number**: Manufacturer serial number
   - **Asset Tag**: Your internal tracking number
   - **Purchase Date**: When acquired
   - **Purchase Price**: For depreciation tracking
   - **Assigned To**: User or department
   - **Location**: Office, floor, desk number
4. Click **"Save Asset"**

## Bulk Import
1. Go to **Assets → Import**
2. Download the CSV template
3. Fill in your asset data
4. Upload the completed CSV
5. Review and confirm the import

## QR Code Scanning (Mobile)
1. Open UltriumAI mobile app
2. Tap **"Scan QR Code"**
3. Point at the asset's QR label
4. View or edit asset details instantly
5. Check in/out assets on the go

## Generating QR Labels
1. Select assets you want to label
2. Click **"Print QR Labels"**
3. Choose label size (standard or small)
4. Print on label sheets (Avery compatible)
5. Apply labels to physical assets
        `
      },
      {
        id: "safetrack-warranty-lookup",
        title: "AI Warranty Lookup",
        type: "guide",
        content: `
# AI Warranty Lookup

SafeTrack's AI can instantly check warranty status for most manufacturers.

## How to Use Warranty Lookup
1. Go to **SafeTrack → Warranty Lookup**
2. Enter the serial number
3. Select the manufacturer (or let AI detect it)
4. Click **"Check Warranty"**
5. View warranty status and expiration

## Supported Manufacturers
- **Computers**: Dell, HP, Lenovo, Apple, ASUS, Acer
- **Networking**: Cisco, Juniper, Ubiquiti, Netgear
- **Servers**: Dell EMC, HPE, Supermicro
- **Printers**: HP, Canon, Epson, Brother
- **Mobile**: Apple, Samsung, Google

## Automatic Warranty Tracking
1. Enable **"Auto-Check Warranties"** in settings
2. SafeTrack checks all assets weekly
3. Receive alerts 30/60/90 days before expiration
4. Plan renewals before coverage lapses

## Warranty Reports
1. Go to **Reports → Warranty Status**
2. View all assets by warranty state:
   - Active (covered)
   - Expiring Soon
   - Expired
   - Unknown
3. Export for procurement planning
        `
      },
      {
        id: "safetrack-depreciation",
        title: "Asset Depreciation & Reporting",
        type: "guide",
        content: `
# Asset Depreciation & Reporting

Track asset value over time for financial planning.

## Setting Up Depreciation
1. Go to **Settings → Depreciation**
2. Choose your method:
   - **Straight-Line**: Equal depreciation each year
   - **Declining Balance**: Higher depreciation early
   - **Custom**: Define your own schedule
3. Set default useful life by category

## Viewing Asset Value
1. Open any asset
2. View the **"Value"** tab
3. See:
   - Original purchase price
   - Current book value
   - Monthly depreciation
   - Projected value timeline

## Depreciation Reports
1. Go to **Reports → Depreciation**
2. Select date range
3. Filter by category or location
4. Export for accounting (CSV, Excel, PDF)

## Disposal & Write-offs
1. When retiring an asset, click **"Dispose"**
2. Enter disposal method:
   - Sold (enter sale price)
   - Donated
   - Recycled
   - Scrapped
3. Record final value adjustment
4. Asset moves to disposal history
        `
      }
    ],
    faqs: [
      {
        q: "Can I track software licenses too?",
        a: "Yes! SafeTrack supports software licenses, subscriptions, and certificates alongside hardware assets. Track license counts, expiration dates, and compliance."
      },
      {
        q: "How does the QR code scanning work?",
        a: "Each asset gets a unique QR code you can print. Scan with any smartphone camera to instantly view or update asset details. Great for inventory audits!"
      },
      {
        q: "Can I set up custom asset fields?",
        a: "Yes, go to Settings → Custom Fields to add any fields you need (e.g., MAC address, warranty type, department code). These appear on all asset forms."
      },
      {
        q: "Does SafeTrack integrate with our ticketing system?",
        a: "Yes! We integrate with ServiceNow, Zendesk, Jira Service Desk, and others. Link assets to tickets for complete incident context."
      }
    ]
  }
];

const SafeSuiteKnowledgeBase = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<any | null>(null);

  const filteredProducts = products.map(product => ({
    ...product,
    articles: product.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    faqs: product.faqs.filter(faq =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(product => 
    product.articles.length > 0 || 
    product.faqs.length > 0 ||
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMarkdown = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-6 mb-4 text-foreground">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-semibold mt-5 mb-3 text-foreground">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-medium mt-4 mb-2 text-foreground">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('> ')) {
        const isWarning = line.includes('⚠️') || line.includes('Important');
        const isTip = line.includes('💡') || line.includes('Tip');
        return (
          <div key={i} className={`p-4 rounded-lg my-3 border-l-4 ${
            isWarning 
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-800 dark:text-amber-200' 
              : isTip 
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-800 dark:text-blue-200'
              : 'bg-muted border-primary text-muted-foreground'
          }`}>
            {line.replace('> ', '')}
          </div>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 text-muted-foreground flex items-start gap-2 my-1">
            <CheckCircle2 className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: formatText(line.replace('- ', '')) }} />
          </li>
        );
      }
      if (line.match(/^\d+\. /)) {
        return (
          <li key={i} className="ml-4 text-muted-foreground my-1 list-decimal list-inside">
            <span dangerouslySetInnerHTML={{ __html: formatText(line.replace(/^\d+\. /, '')) }} />
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="text-muted-foreground my-2" dangerouslySetInnerHTML={{ __html: formatText(line) }} />;
    });
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>');
  };

  const ProductCard = ({ product }: { product: typeof products[0] }) => {
    const Icon = product.icon;
    return (
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden group ${product.branding.border}`}
        onClick={() => setActiveProduct(product.id)}
      >
        {/* Gradient header */}
        <div className={`h-2 bg-gradient-to-r ${product.branding.gradient}`} />
        <CardHeader className={`${product.branding.lightBg}`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={product.logo} 
                alt={product.name}
                className="h-14 w-14 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform"
              />
              <div className={`absolute -bottom-1 -right-1 ${product.branding.icon} p-1 rounded-full`}>
                <Icon className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className={`text-xl ${product.branding.text}`}>{product.name}</CardTitle>
              <CardDescription className="text-sm">{product.tagline}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <BookOpen className="h-4 w-4" />
            <span>{product.articles.length} Guides</span>
            <span className="mx-2">•</span>
            <HelpCircle className="h-4 w-4" />
            <span>{product.faqs.length} FAQs</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {product.articles.slice(0, 2).map(article => (
              <Badge key={article.id} variant="secondary" className="text-xs">
                {article.title.length > 25 ? article.title.substring(0, 25) + '...' : article.title}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (activeArticle) {
    const product = products.find(p => p.articles.some(a => a.id === activeArticle.id));
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => setActiveArticle(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {product?.name || 'Articles'}
          </Button>

          <Card className="overflow-hidden">
            {product && (
              <div className={`h-2 bg-gradient-to-r ${product.branding.gradient}`} />
            )}
            <CardHeader className={product ? product.branding.lightBg : ''}>
              <div className="flex items-center gap-3 mb-2">
                {product && (
                  <img src={product.logo} alt={product.name} className="h-8 w-8 object-contain" />
                )}
                <Badge variant="outline" className="text-xs uppercase tracking-wider">
                  {activeArticle.type}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{activeArticle.title}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              {renderMarkdown(activeArticle.content)}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (activeProduct) {
    const product = products.find(p => p.id === activeProduct);
    if (!product) return null;

    const Icon = product.icon;

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => setActiveProduct(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to SafeSuite Knowledge Base
          </Button>

          {/* Product Header with Branding */}
          <div className={`rounded-2xl overflow-hidden mb-8 ${product.branding.lightBg} border ${product.branding.border}`}>
            <div className={`h-2 bg-gradient-to-r ${product.branding.gradient}`} />
            <div className="p-8">
              <div className="flex items-center gap-6 mb-4">
                <img 
                  src={product.logo} 
                  alt={product.name}
                  className="h-20 w-20 object-contain rounded-2xl shadow-lg"
                />
                <div>
                  <h1 className={`text-3xl font-bold ${product.branding.text}`}>{product.name}</h1>
                  <p className="text-lg text-muted-foreground">{product.tagline}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {safeSuiteProducts[product.id as keyof typeof safeSuiteProducts]?.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Badge className={`${product.branding.icon} text-white`}>
                  <BookOpen className="h-3 w-3 mr-1" />
                  {product.articles.length} Guides
                </Badge>
                <Badge variant="outline">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  {product.faqs.length} FAQs
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="guides" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="guides" className="gap-2">
                <ListChecks className="h-4 w-4" />
                Guides
              </TabsTrigger>
              <TabsTrigger value="faqs" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQs
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Features
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guides">
              <div className="grid md:grid-cols-2 gap-4">
                {product.articles.map((article, index) => (
                  <Card 
                    key={article.id}
                    className={`cursor-pointer hover:shadow-lg transition-all hover:border-primary/30 group overflow-hidden`}
                    onClick={() => setActiveArticle(article)}
                  >
                    <div className={`h-1 bg-gradient-to-r ${product.branding.gradient}`} />
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${product.branding.lightBg} group-hover:scale-105 transition-transform`}>
                          <Icon className={`h-6 w-6 ${product.branding.text}`} />
                        </div>
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs mb-2">{article.type}</Badge>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {article.title}
                          </CardTitle>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="faqs">
              <Card className="overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${product.branding.gradient}`} />
                <CardHeader className={product.branding.lightBg}>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className={`h-5 w-5 ${product.branding.text}`} />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Accordion type="single" collapsible className="space-y-2">
                    {product.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="font-medium">{faq.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features">
              <Card className="overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${product.branding.gradient}`} />
                <CardHeader className={product.branding.lightBg}>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className={`h-5 w-5 ${product.branding.text}`} />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    {safeSuiteProducts[product.id as keyof typeof safeSuiteProducts]?.features.map((feature, idx) => (
                      <div key={idx} className={`p-4 rounded-xl ${product.branding.lightBg} border ${product.branding.border}`}>
                        <CheckCircle2 className={`h-5 w-5 ${product.branding.text} mb-2`} />
                        <p className="text-sm font-medium">{feature}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Header with SafeSuite Branding */}
        <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYtMkgyNHYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative px-8 py-12 md:py-16">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <img 
                src={safesuiteLogo} 
                alt="SafeSuite"
                className="h-20 w-auto object-contain"
              />
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  SafeSuite Knowledge Base
                </h1>
                <p className="text-slate-300 text-lg">
                  Comprehensive documentation for all SafeSuite security products
                </p>
              </div>
            </div>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto md:mx-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search guides, FAQs, and documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                <Shield className="h-3 w-3 mr-1" />
                4 Products
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                <BookOpen className="h-3 w-3 mr-1" />
                {products.reduce((acc, p) => acc + p.articles.length, 0)} Guides
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                <HelpCircle className="h-3 w-3 mr-1" />
                {products.reduce((acc, p) => acc + p.faqs.length, 0)} FAQs
              </Badge>
            </div>
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(searchQuery ? filteredProducts : products).map(product => (
            <ProductCard key={product.id} product={product as typeof products[0]} />
          ))}
        </div>

        {searchQuery && filteredProducts.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try searching with different keywords or browse the products above.
            </p>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SafeSuiteKnowledgeBase;
