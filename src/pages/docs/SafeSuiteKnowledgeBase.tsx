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
  BarChart3, QrCode, Laptop, DollarSign, Calendar, Download, Settings
} from "lucide-react";

// SafeSuite Products Data
const products = [
  {
    id: "safepass",
    name: "SafePass",
    tagline: "Enterprise Password Management",
    icon: Key,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
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
        q: "Is SafePass HIPAA/SOC2 compliant?",
        a: "Yes, SafePass meets HIPAA, SOC2, and GDPR compliance requirements. We provide audit logs and can sign BAAs for healthcare organizations."
      }
    ]
  },
  {
    id: "safescan",
    name: "SafeScan",
    tagline: "AI-Powered Threat Scanner",
    icon: Scan,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
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

## API Integration
\`\`\`javascript
// Scan a file via API
const response = await fetch('/api/safescan/document', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: formData
});
const result = await response.json();
console.log(result.threatLevel); // 'safe' | 'suspicious' | 'malicious'
\`\`\`
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

## Bulk URL Checking
1. Upload a CSV with URLs (one per line)
2. Click **"Bulk Analyze"**
3. Download results with threat scores
4. Filter by risk level

## Integrating with Email
When SafeScan analyzes emails, all embedded URLs are automatically checked. Malicious links are flagged in the email report.
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
      },
      {
        q: "What happens when a threat is detected?",
        a: "Depending on your settings: quarantine the file/email, send an alert, block access, or just log the event. Configure actions in Settings → Threat Response."
      }
    ]
  },
  {
    id: "safeweb",
    name: "SafeWeb",
    tagline: "Dark Web Intelligence",
    icon: Globe,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
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
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
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
3. Select manufacturer (or let AI detect)
4. Click **"Check Warranty"**
5. View warranty status and expiration

## Supported Manufacturers
- Dell / Dell EMC
- HP / HPE
- Lenovo
- Apple
- Microsoft Surface
- Cisco
- Samsung
- ASUS
- Acer
- And many more...

## What You'll See
- **Warranty Status**: Active, Expired, Unknown
- **Expiration Date**: When coverage ends
- **Coverage Type**: Basic, Extended, On-Site
- **Support Options**: Phone, Chat, On-site service

## Bulk Warranty Check
1. Export your assets to CSV
2. Go to **Warranty → Bulk Check**
3. Upload the CSV with serial numbers
4. Download results with warranty info
5. Auto-update asset records

## Setting Warranty Alerts
1. Go to **Settings → Alerts → Warranty**
2. Configure reminder timing:
   - 90 days before expiration
   - 30 days before expiration
   - On expiration day
3. Choose notification method
4. Optionally auto-generate renewal quotes
        `
      },
      {
        id: "safetrack-depreciation",
        title: "Depreciation & Financial Reporting",
        type: "guide",
        content: `
# Depreciation & Financial Reporting

Track asset value over time for accounting and tax purposes.

## Depreciation Methods
SafeTrack supports:
- **Straight-Line**: Equal depreciation each year
- **Declining Balance**: Higher early depreciation
- **Sum-of-Years**: Accelerated method for tax
- **Custom**: Define your own schedule

## Setting Up Depreciation
1. Go to **Settings → Financial → Depreciation**
2. Set default method per category
3. Define useful life by asset type:
   - Laptops: 3-5 years
   - Servers: 5-7 years
   - Monitors: 5 years
   - Mobile devices: 2-3 years
4. Set residual value percentage

## Viewing Current Values
1. Go to **Reports → Asset Valuation**
2. See current book value for all assets
3. Filter by category, location, or status
4. Export for accounting software

## Financial Reports
Available reports include:
- **Asset Valuation Report**: Current value of all assets
- **Depreciation Schedule**: Monthly/yearly depreciation
- **Capex Report**: Capital expenditure summary
- **Audit Report**: Complete asset history
- **Insurance Report**: Replacement values

## Integration with Accounting
1. Go to **Settings → Integrations → Accounting**
2. Connect to QuickBooks, Xero, or NetSuite
3. Enable automatic journal entries
4. Map asset categories to GL accounts
        `
      }
    ],
    faqs: [
      {
        q: "Can I track assets across multiple locations?",
        a: "Yes! Create locations in Settings → Locations, then assign assets to specific sites, buildings, floors, or rooms. Filter and report by location."
      },
      {
        q: "How do I handle asset transfers between employees?",
        a: "Open the asset → Click 'Reassign' → Select new user → Add transfer notes. The change is logged in the audit trail automatically."
      },
      {
        q: "Can I create custom fields for assets?",
        a: "Yes, go to Settings → Custom Fields → Add Field. You can add text, number, date, or dropdown fields to any asset category."
      },
      {
        q: "How does the maintenance scheduling work?",
        a: "Set maintenance intervals (e.g., every 90 days) or specific dates. SafeTrack sends reminders and tracks completion. Link to vendors for service requests."
      },
      {
        q: "Can I import from our current asset tracking system?",
        a: "Yes! We support imports from ServiceNow, Snipe-IT, Asset Panda, Excel, and CSV. Contact support for migration assistance with other systems."
      }
    ]
  }
];

const SafeSuiteKnowledgeBase = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.tagline.toLowerCase().includes(query) ||
      product.articles.some(a => 
        a.title.toLowerCase().includes(query) || 
        a.content.toLowerCase().includes(query)
      ) ||
      product.faqs.some(f => 
        f.q.toLowerCase().includes(query) || 
        f.a.toLowerCase().includes(query)
      )
    );
  });

  const currentProduct = selectedProduct ? products.find(p => p.id === selectedProduct) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => {
            if (selectedArticle) {
              setSelectedArticle(null);
            } else if (selectedProduct) {
              setSelectedProduct(null);
            } else {
              navigate('/docs');
            }
          }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              SafeSuite Knowledge Base
            </h1>
            <p className="text-muted-foreground">
              Complete documentation for all SafeSuite security tools
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search articles, guides, and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-lg"
          />
        </div>

        {/* Content */}
        {!selectedProduct ? (
          // Product Grid
          <div className="grid md:grid-cols-2 gap-6">
            {filteredProducts.map((product) => {
              const Icon = product.icon;
              return (
                <Card 
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                  onClick={() => setSelectedProduct(product.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${product.bgColor}`}>
                        <Icon className={`h-6 w-6 ${product.color}`} />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {product.name}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>{product.tagline}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {product.articles.length} Guides
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="h-4 w-4" />
                        {product.faqs.length} FAQs
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : selectedArticle ? (
          // Article View
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{currentProduct?.name}</Badge>
                <Badge variant="outline">Guide</Badge>
              </div>
              <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedArticle.content.split('\n').map((line: string, i: number) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
                    } else if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>;
                    } else if (line.startsWith('> ')) {
                      return (
                        <div key={i} className="bg-amber-500/10 border-l-4 border-amber-500 p-4 my-4 rounded-r">
                          {line.slice(2)}
                        </div>
                      );
                    } else if (line.startsWith('- ')) {
                      return <li key={i} className="ml-4">{line.slice(2)}</li>;
                    } else if (line.match(/^\d+\./)) {
                      return <li key={i} className="ml-4 list-decimal">{line.slice(line.indexOf('.') + 2)}</li>;
                    } else if (line.startsWith('```')) {
                      return null; // Handle code blocks separately
                    } else if (line.trim()) {
                      return <p key={i} className="my-2">{line}</p>;
                    }
                    return null;
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          // Product Detail View
          <Tabs defaultValue="guides" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentProduct && (
                  <>
                    <div className={`p-3 rounded-xl ${currentProduct.bgColor}`}>
                      <currentProduct.icon className={`h-6 w-6 ${currentProduct.color}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{currentProduct.name}</h2>
                      <p className="text-muted-foreground">{currentProduct.tagline}</p>
                    </div>
                  </>
                )}
              </div>
              <TabsList>
                <TabsTrigger value="guides" className="gap-2">
                  <ListChecks className="h-4 w-4" />
                  Step-by-Step Guides
                </TabsTrigger>
                <TabsTrigger value="faqs" className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  FAQs
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="guides" className="space-y-4">
              {currentProduct?.articles.map((article) => (
                <Card 
                  key={article.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        {article.title}
                      </CardTitle>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="faqs">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {currentProduct?.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SafeSuiteKnowledgeBase;
