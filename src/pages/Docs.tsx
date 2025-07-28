import { useState } from "react";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { 
  BookOpen, 
  Search, 
  Zap, 
  Shield, 
  Settings, 
  Users, 
  MessageSquare,
  Bot,
  FileText,
  Lock,
  Network,
  Mail,
  Link,
  ChevronRight,
  ExternalLink,
  Code,
  Database,
  Globe,
  BarChart3,
  Palette
} from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  articles: Article[];
}

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
}

const docSections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of UltriumAI platform",
    icon: Zap,
    articles: [
      {
        id: "quick-start",
        title: "Quick Start Guide",
        description: "Get up and running with UltriumAI in 5 minutes",
        category: "Basics",
        content: "# Quick Start Guide\n\nWelcome to UltriumAI! This guide will help you get started with our AI-powered platform in just a few minutes.\n\n## Step 1: Create Your Account\n1. Click \"Sign In\" in the top navigation\n2. Choose \"Sign Up\" to create a new account\n3. Verify your email address\n4. Complete your profile setup\n\n## Step 2: Explore UltriumGPT\n1. Navigate to the UltriumGPT section\n2. Start a conversation with our AI assistant\n3. Ask questions about IT procedures, cybersecurity, or business processes\n4. Upload documents to create custom knowledge bases\n\n## Step 3: Try Security Apps\n1. Visit the \"AI Security Apps\" section\n2. Choose from 8 different security tools\n3. Try the live demos\n\n## Step 4: Customize Your Experience\n1. Set up API integrations\n2. Configure white-label options\n3. Invite team members\n4. Create custom GPT workflows",
        tags: ["basics", "setup", "account"]
      },
      {
        id: "account-setup",
        title: "Account Setup & Profile",
        description: "Complete your profile and configure basic settings",
        category: "Basics",
        content: "# Account Setup & Profile\n\n## Profile Configuration\n- Upload avatar image\n- Set display name and bio\n- Configure notification preferences\n- Set timezone and language\n\n## Security Settings\n- Enable two-factor authentication\n- Set up backup codes\n- Configure session timeout\n- Review login history\n\n## Team Setup\n- Create or join teams\n- Set up team roles and permissions\n- Configure team billing\n- Invite team members",
        tags: ["account", "profile", "security", "teams"]
      },
      {
        id: "dashboard-overview",
        title: "Dashboard Overview",
        description: "Navigate the main dashboard and key features",
        category: "Basics",
        content: "# Dashboard Overview\n\n## Main Dashboard\nYour dashboard provides a centralized view of:\n- Recent conversations\n- Usage analytics\n- Security app activity\n- Team notifications\n- Quick actions\n\n## Navigation\n- **UltriumGPT**: AI assistant and chat interface\n- **Security Apps**: Access to all 8 security tools\n- **Analytics**: Usage metrics and insights\n- **Settings**: Account and system configuration\n- **API**: Integration management\n\n## Quick Actions\n- Start new conversation\n- Run security scans\n- Generate reports\n- Access templates",
        tags: ["dashboard", "navigation", "overview"]
      }
    ]
  },
  {
    id: "ultriumgpt",
    title: "UltriumGPT",
    description: "Master our AI assistant for business workflows",
    icon: Bot,
    articles: [
      {
        id: "ultriumgpt-basics",
        title: "UltriumGPT Basics",
        description: "Learn how to effectively use UltriumGPT",
        category: "UltriumGPT",
        content: "# UltriumGPT Basics\n\nUltriumGPT is your intelligent business assistant, trained specifically for MSPs, IT teams, and business professionals.\n\n## What UltriumGPT Can Do\n- Answer technical questions about IT procedures\n- Help with cybersecurity best practices\n- Assist with business process documentation\n- Analyze documents and provide insights\n- Generate reports and summaries\n- Troubleshoot common IT issues\n\n## Getting Started\n1. Click \"UltriumGPT\" in the main navigation\n2. Start typing your question or request\n3. Use @ mentions to reference specific documents\n4. Upload files for analysis\n5. Use conversation history for context\n\n## Best Practices\n- Be specific in your requests\n- Provide context when needed\n- Use follow-up questions for clarity\n- Save important conversations\n- Use templates for common tasks",
        tags: ["chat", "ai", "assistant", "usage"]
      },
      {
        id: "custom-gpts",
        title: "Custom GPT Creation",
        description: "Build and deploy custom AI assistants",
        category: "UltriumGPT",
        content: "# Custom GPT Creation\n\n## Overview\nCreate specialized AI assistants tailored to your specific business needs and workflows.\n\n## Creation Process\n1. **Define Purpose**: Specify the GPT's role and capabilities\n2. **System Prompt**: Write detailed instructions\n3. **Knowledge Base**: Upload relevant documents\n4. **Testing**: Validate responses and behavior\n5. **Deployment**: Make available to team or public\n\n## Configuration Options\n- **Appearance**: Custom avatar and branding\n- **Behavior**: Response style and tone\n- **Knowledge**: Document uploads and web crawling\n- **Integrations**: API connections and webhooks\n- **Access Control**: Public, team, or private\n\n## Advanced Features\n- Web search capabilities\n- File upload processing\n- API integrations\n- Custom actions\n- Analytics tracking",
        tags: ["custom", "gpt", "creation", "deployment"]
      },
      {
        id: "knowledge-management",
        title: "Knowledge Base Management",
        description: "Upload and manage documents for AI training",
        category: "UltriumGPT",
        content: "# Knowledge Base Management\n\n## Document Upload\nSupported formats:\n- PDF documents\n- Word documents (.docx)\n- Text files (.txt)\n- Markdown files (.md)\n- CSV spreadsheets\n- PowerPoint presentations\n\n## Processing Options\n- **Chunking Strategy**: How documents are split\n- **Embedding Model**: AI understanding method\n- **Access Control**: Who can access documents\n- **Version Control**: Track document updates\n\n## Web Crawling\n- Crawl websites for content\n- Set crawl depth and frequency\n- Filter content types\n- Monitor for updates\n- Extract structured data\n\n## Best Practices\n- Use clear, well-structured documents\n- Remove sensitive information\n- Regular updates for accuracy\n- Organize with clear naming\n- Test AI responses after uploads",
        tags: ["knowledge", "documents", "upload", "crawling"]
      },
      {
        id: "conversation-management",
        title: "Conversation Management",
        description: "Organize, share, and export conversations",
        category: "UltriumGPT",
        content: "# Conversation Management\n\n## Organization\n- **Folders**: Group related conversations\n- **Tags**: Label conversations by topic\n- **Search**: Find conversations quickly\n- **Favorites**: Mark important discussions\n- **Archive**: Store old conversations\n\n## Sharing Options\n- **Team Sharing**: Share with team members\n- **Public Links**: Create shareable links\n- **Embed Codes**: Embed in websites\n- **Export Formats**: PDF, Word, Markdown\n\n## Conversation Features\n- **Branching**: Explore different responses\n- **Regeneration**: Get alternative answers\n- **Editing**: Modify messages\n- **Attachments**: Include files in context\n- **Voice Input**: Speak instead of type\n\n## Privacy & Security\n- End-to-end encryption\n- Access controls\n- Audit logs\n- Data retention policies\n- GDPR compliance",
        tags: ["conversations", "sharing", "export", "privacy"]
      }
    ]
  },
  {
    id: "security-apps",
    title: "AI Security Apps",
    description: "Comprehensive guides for all 8 security applications",
    icon: Shield,
    articles: [
      {
        id: "safeemail-guide",
        title: "SafeMail: Email Security Analysis",
        description: "Detect phishing, malware, and threats in emails",
        category: "Security Apps",
        content: "# Ultrium SafeMail™ Guide\n\nAdvanced AI-powered email security analysis to protect against sophisticated threats.\n\n## Key Features\n- **Phishing Detection**: Identify suspicious sender patterns\n- **Malware Scanning**: Deep analysis of attachments\n- **Link Analysis**: URL safety verification\n- **Social Engineering**: Detect manipulation attempts\n- **Threat Intelligence**: Real-time threat feeds\n- **Risk Scoring**: Quantify email threat levels\n\n## How to Use\n1. Upload email files or paste email content\n2. Select analysis depth (quick or comprehensive)\n3. Review detailed threat assessment\n4. Export results for documentation\n5. Set up automated scanning via API\n\n## Analysis Results\n- **Risk Score**: 0-100 threat assessment\n- **Threat Categories**: Specific threat types\n- **IOCs**: Indicators of compromise\n- **Recommendations**: Mitigation steps\n- **Evidence**: Supporting analysis data\n\n## Integration Options\n- Email server integration\n- SIEM platform connectivity\n- Webhook notifications\n- Batch processing APIs\n- Custom reporting formats",
        tags: ["email", "security", "phishing", "malware", "analysis"]
      },
      {
        id: "safelink-guide",
        title: "SafeLink: URL Security Scanner",
        description: "Analyze URLs for malicious content and threats",
        category: "Security Apps",
        content: "# Ultrium SafeLink™ Guide\n\nComprehensive URL analysis and web threat detection system.\n\n## Capabilities\n- **Malware Detection**: Scan for malicious code\n- **Phishing Identification**: Detect fake websites\n- **Content Analysis**: Review page content\n- **Domain Reputation**: Check domain history\n- **SSL Verification**: Validate certificates\n- **Redirect Analysis**: Follow redirect chains\n\n## Scanning Process\n1. Enter URL or upload list of URLs\n2. Choose scan depth and options\n3. Wait for AI analysis completion\n4. Review comprehensive results\n5. Download detailed reports\n\n## Results Dashboard\n- **Safety Score**: Overall risk assessment\n- **Threat Categories**: Types of threats found\n- **Technical Details**: DNS, SSL, headers\n- **Screenshots**: Visual page capture\n- **Historical Data**: Previous scan results\n\n## Use Cases\n- Email link verification\n- Website security audits\n- Brand protection monitoring\n- Incident response investigations\n- Compliance reporting",
        tags: ["url", "link", "security", "scanner", "malware"]
      },
      {
        id: "safedoc-guide",
        title: "SafeDoc: Document Security Scanner",
        description: "Analyze documents for malware and threats",
        category: "Security Apps",
        content: "# Ultrium SafeDoc™ Guide\n\nAdvanced document analysis for malware, macros, and embedded threats.\n\n## Supported Formats\n- **Office Documents**: Word, Excel, PowerPoint\n- **PDF Files**: All PDF versions and variants\n- **Archives**: ZIP, RAR, 7z and compressed files\n- **Images**: JPEG, PNG with embedded data\n- **Scripts**: JavaScript, VBA, PowerShell\n\n## Analysis Features\n- **Macro Detection**: Identify suspicious macros\n- **Embedded Objects**: Find hidden content\n- **Metadata Analysis**: Extract document properties\n- **Structural Analysis**: Validate file integrity\n- **Behavioral Analysis**: Sandbox execution\n- **Hash Comparison**: Check against threat databases\n\n## Security Checks\n- Password-protected files\n- Encrypted content analysis\n- Obfuscated code detection\n- Zero-day exploit patterns\n- Social engineering content\n\n## Reporting\n- Executive summaries\n- Technical analysis details\n- Risk categorization\n- Remediation recommendations\n- Compliance mapping",
        tags: ["document", "security", "malware", "macro", "analysis"]
      },
      {
        id: "safepass-guide",
        title: "SafePass: Password Security Analyzer",
        description: "Evaluate password strength and security",
        category: "Security Apps",
        content: "# Ultrium SafePass™ Guide\n\nComprehensive password security analysis and breach detection.\n\n## Password Analysis\n- **Strength Assessment**: Entropy and complexity scoring\n- **Dictionary Attacks**: Common password checks\n- **Pattern Recognition**: Identify predictable patterns\n- **Character Analysis**: Evaluate character usage\n- **Length Assessment**: Optimal length recommendations\n\n## Breach Detection\n- **Database Checks**: Known breach databases\n- **Hash Comparison**: Secure hash matching\n- **Historical Breaches**: Timeline of exposures\n- **Risk Assessment**: Exposure probability\n- **Account Monitoring**: Ongoing surveillance\n\n## Security Recommendations\n- Password improvement suggestions\n- Multi-factor authentication setup\n- Password manager recommendations\n- Security policy compliance\n- Training recommendations\n\n## Enterprise Features\n- Bulk password analysis\n- Policy compliance checking\n- Employee training integration\n- Audit trail generation\n- Executive reporting",
        tags: ["password", "security", "strength", "breach", "analysis"]
      },
      {
        id: "safescore-guide",
        title: "SafeScore: Computer Security Scanner",
        description: "Comprehensive system and network security analysis",
        category: "Security Apps",
        content: "# Ultrium SafeScore™ Guide\n\nFull-spectrum computer and network security assessment platform.\n\n## System Analysis\n- **Vulnerability Scanning**: Known CVE detection\n- **Configuration Review**: Security hardening check\n- **Service Analysis**: Running services audit\n- **User Account Review**: Access control assessment\n- **Registry Analysis**: Windows registry security\n- **File System Scan**: Suspicious file detection\n\n## Network Security\n- **Port Scanning**: Open port identification\n- **Service Fingerprinting**: Service version detection\n- **Protocol Analysis**: Network traffic review\n- **Firewall Testing**: Rule effectiveness\n- **Wireless Security**: WiFi security assessment\n\n## Compliance Checking\n- **Framework Mapping**: NIST, ISO, CIS standards\n- **Policy Compliance**: Internal policy checks\n- **Regulatory Requirements**: Industry-specific rules\n- **Best Practices**: Security recommendations\n- **Gap Analysis**: Compliance deficiencies\n\n## Remediation\n- Prioritized fix recommendations\n- Step-by-step remediation guides\n- Risk-based prioritization\n- Timeline recommendations\n- Progress tracking",
        tags: ["computer", "system", "network", "security", "vulnerability"]
      },
      {
        id: "safenet-guide",
        title: "SafeNet: Network Security Monitor",
        description: "Real-time network threat detection and analysis",
        category: "Security Apps",
        content: "# Ultrium SafeNet™ Guide\n\nReal-time network monitoring and threat detection system.\n\n## Traffic Analysis\n- **Deep Packet Inspection**: Full traffic analysis\n- **Protocol Decoding**: Application layer analysis\n- **Anomaly Detection**: Unusual pattern identification\n- **Bandwidth Monitoring**: Usage pattern tracking\n- **Geographic Analysis**: Traffic source mapping\n\n## Threat Detection\n- **Intrusion Attempts**: Attack pattern recognition\n- **Malware Communication**: C&C detection\n- **Data Exfiltration**: Suspicious outbound traffic\n- **Lateral Movement**: Internal threat spreading\n- **APT Detection**: Advanced persistent threats\n\n## Monitoring Features\n- **Real-time Alerts**: Immediate threat notifications\n- **Historical Analysis**: Trend identification\n- **Forensic Tools**: Incident investigation\n- **Automated Response**: Threat containment\n- **Integration APIs**: SIEM and SOAR connectivity\n\n## Reporting & Analytics\n- Executive dashboards\n- Technical incident reports\n- Compliance documentation\n- Trend analysis\n- Performance metrics",
        tags: ["network", "monitoring", "traffic", "intrusion", "detection"]
      },
      {
        id: "darkweb-guide",
        title: "DarkWeb: Threat Intelligence Scanner",
        description: "Monitor dark web for organizational threats",
        category: "Security Apps",
        content: "# Ultrium DarkWeb™ Scanner\n\nAdvanced dark web monitoring and threat intelligence platform.\n\n## Monitoring Capabilities\n- **Credential Monitoring**: Stolen login detection\n- **Data Breach Alerts**: Company data exposure\n- **Brand Monitoring**: Trademark and brand abuse\n- **Executive Monitoring**: Leadership team targeting\n- **Infrastructure Monitoring**: IP and domain abuse\n\n## Intelligence Sources\n- **Hidden Forums**: Criminal discussion boards\n- **Marketplaces**: Illegal goods and services\n- **Paste Sites**: Data dump locations\n- **Social Networks**: Criminal social platforms\n- **Communication Channels**: Encrypted messaging\n\n## Alert System\n- **Real-time Notifications**: Immediate threat alerts\n- **Risk Scoring**: Threat severity assessment\n- **Context Analysis**: Threat actor profiling\n- **Attribution**: Source identification\n- **Timeline Tracking**: Threat evolution\n\n## Response Features\n- Incident response playbooks\n- Takedown coordination\n- Law enforcement liaison\n- Victim notification\n- Remediation guidance",
        tags: ["darkweb", "intelligence", "monitoring", "breach", "credential"]
      },
      {
        id: "security-dashboard",
        title: "Security Dashboard Overview",
        description: "Centralized view of all security applications",
        category: "Security Apps",
        content: "# Security Dashboard Overview\n\nUnified SafeSOC for all UltriumAI security applications.\n\n## Dashboard Features\n- **Unified Alerts**: All security apps in one view\n- **Risk Scoring**: Overall security posture\n- **Trend Analysis**: Historical security metrics\n- **Quick Actions**: Rapid response capabilities\n- **Status Monitoring**: System health checks\n\n## Key Metrics\n- **Threat Level**: Current organizational risk\n- **Active Incidents**: Ongoing security events\n- **Resolution Time**: Average response times\n- **Coverage**: Monitored assets percentage\n- **Compliance Status**: Regulatory compliance\n\n## Workflow Integration\n- **SIEM Integration**: Security information management\n- **Ticket System**: Automated incident creation\n- **Notification System**: Multi-channel alerts\n- **Reporting Engine**: Automated report generation\n- **API Access**: Custom integrations\n\n## Team Collaboration\n- Shared incident tracking\n- Role-based access control\n- Communication tools\n- Knowledge sharing\n- Training resources",
        tags: ["dashboard", "security", "monitoring", "alerts", "integration"]
      }
    ]
  },
  {
    id: "api-integration",
    title: "API & Integrations",
    description: "Connect UltriumAI with your existing systems",
    icon: Code,
    articles: [
      {
        id: "api-overview",
        title: "API Overview",
        description: "Introduction to UltriumAI APIs and capabilities",
        category: "API",
        content: "# API Overview\n\nUltriumAI provides comprehensive REST APIs for all platform features.\n\n## Available APIs\n- **Chat API**: UltriumGPT conversation endpoints\n- **Security APIs**: All 8 security application endpoints\n- **User Management**: Account and team management\n- **Analytics API**: Usage and performance metrics\n- **Webhook API**: Real-time event notifications\n\n## Authentication\n- **API Keys**: Secure token-based authentication\n- **OAuth 2.0**: Standard OAuth implementation\n- **JWT Tokens**: JSON Web Token support\n- **Rate Limiting**: Usage-based throttling\n- **IP Whitelisting**: Enhanced security options\n\n## Getting Started\n1. Generate API key in dashboard\n2. Review API documentation\n3. Test endpoints in sandbox\n4. Implement in production\n5. Monitor usage and performance\n\n## Best Practices\n- Secure API key storage\n- Implement proper error handling\n- Use appropriate rate limiting\n- Monitor API usage\n- Keep integrations updated",
        tags: ["api", "integration", "authentication", "documentation"]
      },
      {
        id: "api-keys",
        title: "API Key Management",
        description: "Create and manage API keys for secure access",
        category: "API",
        content: "# API Key Management\n\nSecure creation and management of API keys for platform access.\n\n## Creating API Keys\n1. Navigate to API section in dashboard\n2. Click \"Create New API Key\"\n3. Set key name and description\n4. Configure permissions and scope\n5. Set expiration date (optional)\n6. Generate and securely store key\n\n## Key Types\n- **Full Access**: Complete platform access\n- **Read Only**: Data retrieval only\n- **Security Apps**: Security tool access only\n- **Chat Only**: UltriumGPT conversations only\n- **Analytics**: Metrics and reporting only\n\n## Security Features\n- **Automatic Rotation**: Scheduled key updates\n- **Usage Monitoring**: Track API calls\n- **Rate Limiting**: Prevent abuse\n- **IP Restrictions**: Limit access by IP\n- **Audit Logging**: Complete access logs\n\n## Key Management\n- View usage statistics\n- Revoke compromised keys\n- Set usage limits\n- Monitor performance\n- Export usage reports",
        tags: ["api", "keys", "security", "management", "access"]
      },
      {
        id: "webhooks",
        title: "Webhook Configuration",
        description: "Set up real-time notifications and event handling",
        category: "API",
        content: "# Webhook Configuration\n\nReal-time event notifications for system integration.\n\n## Available Events\n- **Security Alerts**: Threat detection notifications\n- **Chat Events**: Conversation updates\n- **User Events**: Account and team changes\n- **System Events**: Platform status updates\n- **Analytics Events**: Usage milestone notifications\n\n## Setup Process\n1. Define webhook endpoint URL\n2. Select event types to monitor\n3. Configure authentication method\n4. Set retry policies\n5. Test webhook functionality\n\n## Event Payload\n- **Event Type**: Classification of event\n- **Timestamp**: When event occurred\n- **Data**: Event-specific information\n- **Metadata**: Additional context\n- **Signature**: Security verification\n\n## Security\n- **HTTPS Required**: Encrypted transmission\n- **Signature Verification**: Payload authenticity\n- **IP Whitelisting**: Source verification\n- **Retry Logic**: Delivery guarantee\n- **Rate Limiting**: Prevent flooding",
        tags: ["webhooks", "events", "notifications", "integration", "real-time"]
      },
      {
        id: "third-party-integrations",
        title: "Third-Party Integrations",
        description: "Connect with popular business tools and platforms",
        category: "Integrations",
        content: "# Third-Party Integrations\n\nSeamless connectivity with popular business and security platforms.\n\n## Security Platforms\n- **SIEM Systems**: Splunk, QRadar, LogRhythm\n- **SOAR Platforms**: Phantom, Demisto, Swimlane\n- **Ticketing Systems**: ServiceNow, Jira, Zendesk\n- **Email Security**: Proofpoint, Mimecast, Office 365\n- **Endpoint Protection**: CrowdStrike, SentinelOne\n\n## Business Tools\n- **Communication**: Slack, Microsoft Teams, Discord\n- **Documentation**: Confluence, Notion, SharePoint\n- **CRM Systems**: Salesforce, HubSpot, Pipedrive\n- **Cloud Platforms**: AWS, Azure, Google Cloud\n- **Monitoring**: Datadog, New Relic, Grafana\n\n## Integration Methods\n- **Native Connectors**: Pre-built integrations\n- **API Connections**: Custom API integrations\n- **Webhook Events**: Real-time notifications\n- **File Sync**: Automated data exchange\n- **SSO Integration**: Single sign-on support\n\n## Configuration\n- Step-by-step setup guides\n- Authentication requirements\n- Data mapping options\n- Sync frequency settings\n- Error handling procedures",
        tags: ["integrations", "siem", "soar", "business", "platforms"]
      }
    ]
  },
  {
    id: "team-management",
    title: "Team & Collaboration",
    description: "Manage teams, roles, and collaborative workflows",
    icon: Users,
    articles: [
      {
        id: "team-setup",
        title: "Team Setup & Management",
        description: "Create and manage teams with role-based access",
        category: "Teams",
        content: "# Team Setup & Management\n\nComprehensive team management with role-based access control.\n\n## Creating Teams\n1. Navigate to Team Management\n2. Click \"Create New Team\"\n3. Set team name and description\n4. Configure team settings\n5. Invite initial members\n\n## Team Roles\n- **Owner**: Full administrative access\n- **Admin**: Team management and configuration\n- **Member**: Standard platform access\n- **Viewer**: Read-only access\n- **Guest**: Limited temporary access\n\n## Access Control\n- **Resource Permissions**: Control access to features\n- **Data Segmentation**: Team-specific data isolation\n- **API Access**: Team-scoped API keys\n- **Audit Trails**: Complete activity logging\n- **Compliance**: Role-based compliance tracking\n\n## Team Features\n- Shared conversations\n- Team knowledge bases\n- Collaborative security monitoring\n- Group analytics\n- Team-wide settings",
        tags: ["teams", "management", "roles", "access", "collaboration"]
      },
      {
        id: "user-invitations",
        title: "User Invitations & Onboarding",
        description: "Invite users and streamline onboarding process",
        category: "Teams",
        content: "# User Invitations & Onboarding\n\nStreamlined user invitation and onboarding workflows.\n\n## Invitation Process\n1. Click \"Invite Users\" in team dashboard\n2. Enter email addresses (bulk supported)\n3. Select role and permissions\n4. Add personalized welcome message\n5. Send invitations\n\n## Invitation Options\n- **Role Assignment**: Pre-set user roles\n- **Resource Access**: Specific feature access\n- **Expiration Dates**: Time-limited invitations\n- **Custom Messages**: Personalized welcome\n- **Bulk Operations**: Multiple user invitations\n\n## Onboarding Checklist\n- Account activation\n- Profile completion\n- Security setup (2FA)\n- Training module completion\n- First conversation or scan\n\n## Management Features\n- Track invitation status\n- Resend failed invitations\n- Revoke pending invitations\n- Monitor onboarding progress\n- Generate completion reports",
        tags: ["invitations", "onboarding", "users", "setup", "training"]
      },
      {
        id: "collaboration-features",
        title: "Collaboration Features",
        description: "Tools for effective team collaboration",
        category: "Teams",
        content: "# Collaboration Features\n\nAdvanced collaboration tools for team productivity.\n\n## Shared Workspaces\n- **Team Conversations**: Shared chat histories\n- **Knowledge Bases**: Collaborative document management\n- **Security Monitoring**: Team-wide threat visibility\n- **Project Spaces**: Organized collaboration areas\n- **Resource Libraries**: Shared templates and assets\n\n## Communication Tools\n- **Internal Messaging**: Team communication\n- **Annotations**: Collaborative note-taking\n- **Comments**: Conversation threading\n- **Mentions**: Team member notifications\n- **Status Updates**: Project progress tracking\n\n## Workflow Management\n- **Task Assignment**: Distribute work items\n- **Progress Tracking**: Monitor completion status\n- **Approval Workflows**: Review and approval processes\n- **Automated Routing**: Smart work distribution\n- **Escalation Rules**: Issue escalation protocols\n\n## Knowledge Sharing\n- Team knowledge bases\n- Best practice documentation\n- Training material sharing\n- Expertise location\n- Collaborative editing",
        tags: ["collaboration", "communication", "workflow", "sharing", "productivity"]
      }
    ]
  },
  {
    id: "white-label",
    title: "White Label & Customization",
    description: "Brand customization and white-label deployment",
    icon: Palette,
    articles: [
      {
        id: "branding-setup",
        title: "Branding & Visual Customization",
        description: "Customize the platform with your brand identity",
        category: "White Label",
        content: "# Branding & Visual Customization\n\nComplete brand customization for white-label deployments.\n\n## Visual Elements\n- **Logo Upload**: Custom company logos\n- **Color Schemes**: Brand color implementation\n- **Typography**: Custom font selection\n- **Themes**: Light and dark mode customization\n- **Icons**: Custom icon libraries\n\n## Interface Customization\n- **Navigation**: Custom menu structures\n- **Dashboard Layout**: Personalized dashboards\n- **Landing Pages**: Custom welcome screens\n- **Footer Content**: Company information\n- **Help Documentation**: Branded support content\n\n## Brand Guidelines\n- Logo usage specifications\n- Color palette definitions\n- Typography standards\n- Design system documentation\n- Asset management\n\n## Implementation\n1. Upload brand assets\n2. Configure color schemes\n3. Set typography preferences\n4. Customize interface elements\n5. Preview and publish changes",
        tags: ["branding", "customization", "white-label", "design", "themes"]
      },
      {
        id: "domain-setup",
        title: "Custom Domain Configuration",
        description: "Set up custom domains for your white-label deployment",
        category: "White Label",
        content: "# Custom Domain Configuration\n\nProfessional domain setup for white-label platforms.\n\n## Domain Requirements\n- **SSL Certificate**: HTTPS encryption required\n- **DNS Configuration**: Proper DNS record setup\n- **Domain Validation**: Ownership verification\n- **Subdomain Support**: Multiple subdomain options\n- **CDN Integration**: Global content delivery\n\n## Setup Process\n1. Purchase or prepare custom domain\n2. Configure DNS records\n3. Verify domain ownership\n4. Upload SSL certificate\n5. Test domain configuration\n6. Deploy to production\n\n## DNS Configuration\n- **A Records**: Point to platform servers\n- **CNAME Records**: Subdomain configuration\n- **MX Records**: Email routing (optional)\n- **TXT Records**: Domain verification\n- **TTL Settings**: Cache optimization\n\n## Management Features\n- Domain health monitoring\n- SSL certificate renewal\n- DNS propagation tracking\n- Performance optimization\n- Backup domain configuration",
        tags: ["domain", "dns", "ssl", "hosting", "configuration"]
      },
      {
        id: "feature-configuration",
        title: "Feature Configuration",
        description: "Enable and customize platform features",
        category: "White Label",
        content: "# Feature Configuration\n\nGranular control over platform features and capabilities.\n\n## Feature Toggles\n- **Security Apps**: Enable/disable specific tools\n- **AI Features**: Control AI capabilities\n- **Integrations**: Available third-party connections\n- **Analytics**: Reporting and metrics access\n- **User Features**: Account management options\n\n## Access Controls\n- **Role-Based Features**: Feature access by role\n- **Usage Limits**: Feature usage restrictions\n- **Subscription Tiers**: Tiered feature access\n- **Custom Permissions**: Granular access control\n- **Feature Licensing**: Commercial feature management\n\n## Customization Options\n- **Interface Layout**: Custom page arrangements\n- **Workflow Configuration**: Business process alignment\n- **Default Settings**: Pre-configured preferences\n- **Template Management**: Custom templates\n- **Automation Rules**: Custom automation\n\n## Deployment Settings\n- Environment configuration\n- Performance optimization\n- Security hardening\n- Monitoring setup\n- Backup configuration",
        tags: ["features", "configuration", "access", "customization", "deployment"]
      }
    ]
  },
  {
    id: "analytics",
    title: "Analytics & Reporting",
    description: "Comprehensive analytics and reporting capabilities",
    icon: BarChart3,
    articles: [
      {
        id: "usage-analytics",
        title: "Usage Analytics",
        description: "Track platform usage and user engagement",
        category: "Analytics",
        content: "# Usage Analytics\n\nComprehensive usage tracking and engagement analytics.\n\n## Key Metrics\n- **Active Users**: Daily, weekly, monthly active users\n- **Session Duration**: Average time spent on platform\n- **Feature Usage**: Most/least used features\n- **Conversation Volume**: Chat activity metrics\n- **API Calls**: Integration usage statistics\n\n## User Behavior\n- **User Journeys**: Path analysis through platform\n- **Feature Adoption**: New feature uptake rates\n- **Engagement Patterns**: Peak usage times\n- **Drop-off Points**: Where users disengage\n- **Success Metrics**: Goal completion rates\n\n## Performance Metrics\n- **Response Times**: System performance tracking\n- **Uptime Statistics**: Availability monitoring\n- **Error Rates**: System reliability metrics\n- **Throughput**: Processing capacity utilization\n- **Resource Usage**: System resource consumption\n\n## Reporting Options\n- Real-time dashboards\n- Scheduled reports\n- Custom report builder\n- Data export capabilities\n- Executive summaries",
        tags: ["usage", "analytics", "metrics", "engagement", "performance"]
      },
      {
        id: "security-analytics",
        title: "Security Analytics",
        description: "Security-focused analytics and threat intelligence",
        category: "Analytics",
        content: "# Security Analytics\n\nAdvanced security analytics and threat intelligence reporting.\n\n## Threat Metrics\n- **Threat Detection Rate**: Successful threat identification\n- **False Positive Rate**: Accuracy measurements\n- **Response Time**: Time to threat resolution\n- **Severity Distribution**: Threat categorization\n- **Attack Trends**: Emerging threat patterns\n\n## Risk Assessment\n- **Risk Scoring**: Organizational risk levels\n- **Vulnerability Trends**: Security posture over time\n- **Compliance Status**: Regulatory compliance tracking\n- **Incident Frequency**: Security incident rates\n- **Remediation Effectiveness**: Fix success rates\n\n## Security Reporting\n- **Executive Dashboards**: High-level security overview\n- **Technical Reports**: Detailed technical analysis\n- **Compliance Reports**: Regulatory documentation\n- **Incident Reports**: Security event documentation\n- **Trend Analysis**: Historical security trends\n\n## Intelligence Integration\n- **Threat Intelligence Feeds**: External threat data\n- **IOC Tracking**: Indicator of compromise monitoring\n- **Attribution Analysis**: Threat actor identification\n- **Campaign Tracking**: Attack campaign monitoring\n- **Predictive Analytics**: Future threat prediction",
        tags: ["security", "analytics", "threats", "risk", "compliance"]
      },
      {
        id: "custom-reports",
        title: "Custom Report Builder",
        description: "Create custom reports and dashboards",
        category: "Analytics",
        content: "# Custom Report Builder\n\nFlexible report creation with drag-and-drop interface.\n\n## Report Types\n- **Executive Reports**: High-level summaries\n- **Operational Reports**: Detailed operational data\n- **Compliance Reports**: Regulatory compliance\n- **Performance Reports**: System performance metrics\n- **Custom Dashboards**: Personalized views\n\n## Data Sources\n- **Platform Analytics**: Usage and engagement data\n- **Security Data**: Threat and vulnerability information\n- **User Data**: Account and team metrics\n- **API Data**: Integration usage statistics\n- **External Data**: Third-party data sources\n\n## Visualization Options\n- **Charts**: Bar, line, pie, scatter plots\n- **Tables**: Sortable data tables\n- **Maps**: Geographic visualizations\n- **Gauges**: Performance indicators\n- **Heatmaps**: Pattern visualization\n\n## Report Features\n- **Scheduling**: Automated report generation\n- **Distribution**: Email and notification delivery\n- **Filtering**: Dynamic data filtering\n- **Drill-down**: Detailed data exploration\n- **Export**: Multiple format support",
        tags: ["reports", "custom", "dashboards", "visualization", "automation"]
      }
    ]
  },
  {
    id: "deployment",
    title: "Deployment & Configuration",
    description: "Platform deployment and configuration guides",
    icon: Database,
    articles: [
      {
        id: "installation-guide",
        title: "Installation Guide",
        description: "Step-by-step platform installation instructions",
        category: "Deployment",
        content: "# Installation Guide\n\nComprehensive installation instructions for UltriumAI platform.\n\n## System Requirements\n- **Operating System**: Linux (Ubuntu 20.04+), Windows Server 2019+\n- **Memory**: Minimum 16GB RAM, Recommended 32GB+\n- **Storage**: 500GB SSD minimum\n- **CPU**: 8 cores minimum, 16 cores recommended\n- **Network**: High-speed internet connection\n\n## Prerequisites\n- **Docker**: Container runtime environment\n- **Kubernetes**: Container orchestration (optional)\n- **Database**: PostgreSQL 13+ or MongoDB 5.0+\n- **SSL Certificate**: Valid SSL/TLS certificate\n- **Domain**: Configured domain name\n\n## Installation Steps\n1. **Environment Preparation**\n   - Update system packages\n   - Install Docker and dependencies\n   - Configure firewall rules\n   - Set up monitoring\n\n2. **Database Setup**\n   - Install PostgreSQL\n   - Create database and users\n   - Configure connection settings\n   - Run initial migrations\n\n3. **Application Deployment**\n   - Download application images\n   - Configure environment variables\n   - Deploy application containers\n   - Verify installation\n\n4. **Post-Installation**\n   - Configure SSL certificates\n   - Set up monitoring and logging\n   - Create admin accounts\n   - Test functionality",
        tags: ["installation", "deployment", "setup", "requirements", "configuration"]
      },
      {
        id: "cloud-deployment",
        title: "Cloud Deployment Options",
        description: "Deploy UltriumAI on major cloud platforms",
        category: "Deployment",
        content: "# Cloud Deployment Options\n\nDeploy UltriumAI on AWS, Azure, Google Cloud, and other platforms.\n\n## AWS Deployment\n- **EC2 Instances**: Virtual server deployment\n- **EKS Clusters**: Kubernetes-based deployment\n- **RDS Database**: Managed database service\n- **CloudFront**: Content delivery network\n- **Route 53**: DNS management\n- **ALB/NLB**: Load balancing\n\n## Azure Deployment\n- **Virtual Machines**: Compute instances\n- **AKS Clusters**: Azure Kubernetes Service\n- **Azure Database**: Managed PostgreSQL\n- **Azure CDN**: Content delivery\n- **Azure DNS**: Domain management\n- **Application Gateway**: Load balancing\n\n## Google Cloud Deployment\n- **Compute Engine**: Virtual machines\n- **GKE Clusters**: Google Kubernetes Engine\n- **Cloud SQL**: Managed database\n- **Cloud CDN**: Content delivery\n- **Cloud DNS**: DNS management\n- **Cloud Load Balancing**: Traffic distribution\n\n## Deployment Automation\n- **Terraform**: Infrastructure as code\n- **Ansible**: Configuration management\n- **Helm Charts**: Kubernetes deployments\n- **CI/CD Pipelines**: Automated deployment\n- **Monitoring**: Health checks and alerts",
        tags: ["cloud", "aws", "azure", "gcp", "kubernetes", "automation"]
      },
      {
        id: "configuration-management",
        title: "Configuration Management",
        description: "Manage platform configuration and settings",
        category: "Deployment",
        content: "# Configuration Management\n\nCentralized configuration management for UltriumAI platform.\n\n## Configuration Files\n- **Application Config**: Core application settings\n- **Database Config**: Database connection parameters\n- **Security Config**: Security and authentication settings\n- **Integration Config**: Third-party service settings\n- **Feature Flags**: Feature enablement configuration\n\n## Environment Management\n- **Development**: Development environment settings\n- **Staging**: Pre-production configuration\n- **Production**: Live environment settings\n- **Testing**: Automated testing configuration\n- **Disaster Recovery**: Backup environment setup\n\n## Configuration Sources\n- **Environment Variables**: Runtime configuration\n- **Config Files**: Static configuration files\n- **Database Storage**: Dynamic configuration\n- **External Services**: Remote configuration\n- **Command Line**: Override parameters\n\n## Best Practices\n- **Version Control**: Track configuration changes\n- **Validation**: Validate configuration syntax\n- **Secrets Management**: Secure sensitive data\n- **Documentation**: Document configuration options\n- **Testing**: Test configuration changes\n\n## Tools and Integration\n- **Consul**: Service discovery and configuration\n- **Vault**: Secrets management\n- **Kubernetes ConfigMaps**: Container configuration\n- **AWS Parameter Store**: Cloud configuration\n- **Azure Key Vault**: Secret management",
        tags: ["configuration", "management", "environment", "secrets", "automation"]
      }
    ]
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting & Support",
    description: "Common issues, solutions, and support resources",
    icon: Settings,
    articles: [
      {
        id: "common-issues",
        title: "Common Issues & Solutions",
        description: "Troubleshoot frequent problems and error messages",
        category: "Support",
        content: "# Common Issues & Solutions\n\nComprehensive troubleshooting guide for common platform issues.\n\n## Login & Authentication\n\n### Can't Sign In\n- **Check Credentials**: Verify email and password\n- **Password Reset**: Use \"Forgot Password\" link\n- **Account Verification**: Check email for verification link\n- **Browser Issues**: Clear cache, try incognito mode\n- **2FA Problems**: Use backup codes or contact support\n\n### Session Expiration\n- **Timeout Settings**: Check session timeout configuration\n- **Browser Storage**: Clear browser cookies and storage\n- **Multiple Sessions**: Log out from other devices\n- **Security Settings**: Review security policy settings\n\n## Performance Issues\n\n### Slow Loading\n- **Network Connection**: Check internet connectivity\n- **Browser Performance**: Update browser, disable extensions\n- **Server Status**: Check platform status page\n- **Cache Issues**: Clear browser cache\n- **Resource Usage**: Monitor system resources\n\n### API Timeouts\n- **Rate Limiting**: Check API rate limits\n- **Network Latency**: Test network connectivity\n- **Payload Size**: Reduce request size\n- **Server Load**: Check server performance\n- **Retry Logic**: Implement proper retry mechanisms\n\n## Feature-Specific Issues\n\n### UltriumGPT Not Responding\n- **Model Status**: Check AI model availability\n- **Credit Limits**: Verify account credits\n- **Input Validation**: Check message formatting\n- **Knowledge Base**: Ensure documents are processed\n- **API Connectivity**: Test API endpoints\n\n### Security Scans Failing\n- **File Format**: Verify supported file types\n- **File Size**: Check size limitations\n- **Network Access**: Ensure internet connectivity\n- **Subscription Status**: Verify active subscription\n- **Queue Status**: Check processing queue\n\n## Getting Help\n- **Email Support**: support@ultriumai.com\n- **Phone Support**: 888-884-1410\n- **Live Chat**: Available during business hours\n- **Documentation**: Comprehensive help articles\n- **Community Forum**: User community support",
        tags: ["troubleshooting", "support", "issues", "help", "solutions"]
      },
      {
        id: "error-codes",
        title: "Error Code Reference",
        description: "Comprehensive list of error codes and meanings",
        category: "Support",
        content: "# Error Code Reference\n\nComplete reference for platform error codes and resolution steps.\n\n## Authentication Errors (1000-1999)\n\n### 1001: Invalid Credentials\n- **Cause**: Incorrect username or password\n- **Solution**: Verify credentials, reset password if needed\n- **Prevention**: Use strong, unique passwords\n\n### 1002: Account Locked\n- **Cause**: Multiple failed login attempts\n- **Solution**: Wait for lockout period or contact support\n- **Prevention**: Enable 2FA, use password manager\n\n### 1003: Session Expired\n- **Cause**: Session timeout or security policy\n- **Solution**: Log in again\n- **Prevention**: Adjust session timeout settings\n\n## API Errors (2000-2999)\n\n### 2001: Rate Limit Exceeded\n- **Cause**: Too many API requests in time window\n- **Solution**: Implement backoff strategy\n- **Prevention**: Monitor usage, optimize requests\n\n### 2002: Invalid API Key\n- **Cause**: Missing, expired, or malformed API key\n- **Solution**: Generate new API key\n- **Prevention**: Secure key storage, regular rotation\n\n### 2003: Insufficient Permissions\n- **Cause**: API key lacks required permissions\n- **Solution**: Update API key permissions\n- **Prevention**: Follow principle of least privilege\n\n## Processing Errors (3000-3999)\n\n### 3001: File Upload Failed\n- **Cause**: Network issue or file corruption\n- **Solution**: Retry upload, check file integrity\n- **Prevention**: Validate files before upload\n\n### 3002: Processing Timeout\n- **Cause**: Large file or system overload\n- **Solution**: Reduce file size, retry later\n- **Prevention**: Optimize file size, batch processing\n\n### 3003: Unsupported Format\n- **Cause**: File format not supported\n- **Solution**: Convert to supported format\n- **Prevention**: Check format requirements\n\n## System Errors (4000-4999)\n\n### 4001: Service Unavailable\n- **Cause**: System maintenance or overload\n- **Solution**: Wait and retry\n- **Prevention**: Monitor status page\n\n### 4002: Database Connection Failed\n- **Cause**: Database connectivity issues\n- **Solution**: Contact support\n- **Prevention**: Regular system monitoring\n\n### 4003: Internal Server Error\n- **Cause**: Unexpected system error\n- **Solution**: Contact support with error details\n- **Prevention**: Report recurring errors",
        tags: ["errors", "codes", "reference", "debugging", "resolution"]
      },
      {
        id: "performance-optimization",
        title: "Performance Optimization",
        description: "Optimize platform performance and efficiency",
        category: "Support",
        content: "# Performance Optimization\n\nOptimize UltriumAI platform performance for better user experience.\n\n## System Optimization\n\n### Server Configuration\n- **Memory Allocation**: Optimize RAM usage\n- **CPU Settings**: Configure processor affinity\n- **Storage**: Use SSD storage for better I/O\n- **Network**: Optimize network configuration\n- **Caching**: Implement effective caching strategies\n\n### Database Optimization\n- **Indexing**: Create appropriate database indexes\n- **Query Optimization**: Optimize database queries\n- **Connection Pooling**: Manage database connections\n- **Partitioning**: Partition large tables\n- **Maintenance**: Regular database maintenance\n\n## Application Optimization\n\n### Frontend Performance\n- **Asset Optimization**: Minimize CSS/JS files\n- **Image Compression**: Optimize image sizes\n- **Lazy Loading**: Load content on demand\n- **CDN Usage**: Use content delivery networks\n- **Browser Caching**: Leverage browser caching\n\n### API Performance\n- **Request Optimization**: Minimize API calls\n- **Payload Optimization**: Reduce data transfer\n- **Compression**: Enable response compression\n- **Connection Reuse**: Reuse HTTP connections\n- **Async Processing**: Use asynchronous processing\n\n## Monitoring and Alerts\n\n### Performance Metrics\n- **Response Time**: Monitor API response times\n- **Throughput**: Track request volume\n- **Error Rate**: Monitor error percentages\n- **Resource Usage**: Track CPU, memory, disk usage\n- **User Experience**: Monitor user interaction metrics\n\n### Alerting\n- **Threshold Alerts**: Set performance thresholds\n- **Trend Analysis**: Monitor performance trends\n- **Predictive Alerts**: Predict performance issues\n- **Escalation**: Define alert escalation procedures\n- **Documentation**: Document performance baselines",
        tags: ["performance", "optimization", "monitoring", "efficiency", "tuning"]
      },
      {
        id: "backup-recovery",
        title: "Backup & Recovery",
        description: "Data backup and disaster recovery procedures",
        category: "Support",
        content: "# Backup & Recovery\n\nComprehensive backup and disaster recovery procedures.\n\n## Backup Strategy\n\n### Data Types\n- **User Data**: Conversations, documents, settings\n- **Configuration**: Platform and integration settings\n- **Databases**: Complete database backups\n- **Files**: Uploaded documents and assets\n- **Logs**: System and audit logs\n\n### Backup Schedule\n- **Real-time**: Critical data replication\n- **Hourly**: Transaction log backups\n- **Daily**: Full database backups\n- **Weekly**: Complete system backups\n- **Monthly**: Archive backups\n\n### Storage Options\n- **Local Storage**: On-site backup storage\n- **Cloud Storage**: Remote cloud backups\n- **Multiple Locations**: Geographic distribution\n- **Encryption**: Encrypted backup storage\n- **Retention**: Backup retention policies\n\n## Recovery Procedures\n\n### Recovery Types\n- **Point-in-Time**: Restore to specific time\n- **Full Restore**: Complete system restoration\n- **Partial Restore**: Selective data recovery\n- **Hot Standby**: Immediate failover\n- **Cold Standby**: Manual activation backup\n\n### Recovery Steps\n1. **Assessment**: Evaluate damage scope\n2. **Notification**: Alert stakeholders\n3. **Isolation**: Isolate affected systems\n4. **Recovery**: Execute recovery procedures\n5. **Validation**: Verify data integrity\n6. **Resumption**: Resume normal operations\n\n### Testing\n- **Regular Testing**: Monthly recovery tests\n- **Documentation**: Test procedure documentation\n- **Validation**: Verify backup integrity\n- **Performance**: Test recovery time objectives\n- **Training**: Staff recovery training",
        tags: ["backup", "recovery", "disaster", "procedures", "data"]
      }
    ]
  },
  {
    id: "compliance",
    title: "Compliance & Security",
    description: "Security standards, compliance, and regulatory information",
    icon: Lock,
    articles: [
      {
        id: "security-standards",
        title: "Security Standards & Certifications",
        description: "Overview of security standards and compliance certifications",
        category: "Compliance",
        content: "# Security Standards & Certifications\n\nUltriumAI maintains the highest security standards and compliance certifications.\n\n## Security Frameworks\n\n### ISO 27001\n- **Information Security Management**: Comprehensive security management\n- **Risk Assessment**: Regular security risk evaluations\n- **Continuous Improvement**: Ongoing security enhancements\n- **Audit Requirements**: Regular internal and external audits\n- **Documentation**: Complete security documentation\n\n### SOC 2 Type II\n- **Security**: Logical and physical access controls\n- **Availability**: System uptime and performance\n- **Processing Integrity**: Complete and accurate processing\n- **Confidentiality**: Protection of confidential information\n- **Privacy**: Personal information protection\n\n### GDPR Compliance\n- **Data Protection**: EU data protection regulations\n- **Right to Erasure**: Data deletion capabilities\n- **Data Portability**: Data export functionality\n- **Consent Management**: User consent tracking\n- **Breach Notification**: Incident reporting procedures\n\n## Technical Security\n\n### Encryption\n- **Data at Rest**: AES-256 encryption\n- **Data in Transit**: TLS 1.3 encryption\n- **Key Management**: Hardware security modules\n- **Certificate Management**: Automated certificate rotation\n- **End-to-End**: Client-to-server encryption\n\n### Access Controls\n- **Multi-Factor Authentication**: Required for all accounts\n- **Role-Based Access**: Granular permission system\n- **Zero Trust**: Never trust, always verify\n- **Privileged Access**: Enhanced controls for admin access\n- **Session Management**: Secure session handling\n\n### Infrastructure Security\n- **Network Segmentation**: Isolated network zones\n- **Intrusion Detection**: Real-time threat monitoring\n- **Vulnerability Management**: Regular security assessments\n- **Incident Response**: 24/7 SafeSOC\n- **Physical Security**: Secure data center facilities",
        tags: ["security", "compliance", "standards", "certification", "audit"]
      },
      {
        id: "data-privacy",
        title: "Data Privacy & Protection",
        description: "Data handling, privacy policies, and protection measures",
        category: "Compliance",
        content: "# Data Privacy & Protection\n\nComprehensive data privacy and protection measures.\n\n## Data Classification\n\n### Public Data\n- **Marketing Materials**: Publicly available content\n- **Product Information**: Feature descriptions\n- **Documentation**: Public help articles\n- **Compliance**: No special protection required\n\n### Internal Data\n- **Business Information**: Company operational data\n- **Employee Data**: Staff information (limited)\n- **System Logs**: Operational logging data\n- **Protection**: Standard encryption and access controls\n\n### Confidential Data\n- **Customer Data**: User account information\n- **Business Intelligence**: Analytics and reports\n- **Financial Data**: Billing and payment information\n- **Protection**: Enhanced encryption and access controls\n\n### Restricted Data\n- **Personal Information**: PII and sensitive data\n- **Security Information**: Keys, certificates, secrets\n- **Legal Data**: Contracts and legal documents\n- **Protection**: Maximum security measures\n\n## Privacy Controls\n\n### Data Minimization\n- **Collection Limitation**: Collect only necessary data\n- **Purpose Limitation**: Use data only for stated purposes\n- **Retention Limitation**: Delete data when no longer needed\n- **Storage Limitation**: Minimize data storage locations\n\n### User Rights\n- **Access Right**: Users can view their data\n- **Rectification Right**: Users can correct data\n- **Erasure Right**: Users can delete data\n- **Portability Right**: Users can export data\n- **Objection Right**: Users can object to processing\n\n### Consent Management\n- **Explicit Consent**: Clear consent mechanisms\n- **Granular Consent**: Specific purpose consent\n- **Withdrawal**: Easy consent withdrawal\n- **Documentation**: Consent tracking and logging\n- **Renewal**: Periodic consent renewal",
        tags: ["privacy", "data", "protection", "gdpr", "consent"]
      },
      {
        id: "audit-compliance",
        title: "Audit & Compliance Reporting",
        description: "Audit procedures and compliance reporting capabilities",
        category: "Compliance",
        content: "# Audit & Compliance Reporting\n\nComprehensive audit trails and compliance reporting capabilities.\n\n## Audit Logging\n\n### Event Types\n- **Authentication Events**: Login/logout activities\n- **Data Access**: File and record access\n- **Configuration Changes**: System modifications\n- **Security Events**: Security-related activities\n- **API Usage**: Integration and API calls\n\n### Log Details\n- **Timestamp**: Precise event timing\n- **User Identity**: Who performed the action\n- **Action Type**: What was done\n- **Resource**: What was accessed/modified\n- **Result**: Success or failure status\n- **Source**: IP address and location\n\n### Log Management\n- **Retention**: Long-term log retention\n- **Integrity**: Tamper-proof log storage\n- **Search**: Advanced log search capabilities\n- **Export**: Log export for external analysis\n- **Alerts**: Real-time security alerts\n\n## Compliance Reporting\n\n### Report Types\n- **Access Reports**: User access summaries\n- **Security Reports**: Security event analysis\n- **Privacy Reports**: Data handling compliance\n- **Operational Reports**: System operation metrics\n- **Executive Reports**: High-level compliance status\n\n### Automated Reporting\n- **Scheduled Reports**: Regular compliance reports\n- **Real-time Dashboards**: Live compliance status\n- **Exception Reports**: Non-compliance alerts\n- **Trend Analysis**: Compliance trend tracking\n- **Custom Reports**: Tailored compliance reports\n\n### External Audits\n- **Audit Preparation**: Support for external audits\n- **Evidence Collection**: Automated evidence gathering\n- **Audit Trails**: Complete activity documentation\n- **Remediation Tracking**: Issue resolution tracking\n- **Certification Support**: Compliance certification assistance",
        tags: ["audit", "compliance", "reporting", "logging", "certification"]
      }
    ]
  }
];

const Docs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Flatten all articles for search
  const allArticles = docSections.flatMap(section => section.articles);

  // Filter articles based on search and category
  const filteredArticles = allArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(allArticles.map(article => article.category)))];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <BookOpen className="h-12 w-12 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Knowledge Base
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Complete guides, tutorials, and reference materials for UltriumAI platform. 
              Learn how to maximize your productivity with our AI-powered tools.
            </p>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search knowledge base..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 text-lg"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm capitalize"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All Categories" : category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {docSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <div
                          key={section.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedCategory(section.articles[0]?.category || "all");
                            setSelectedArticle(null);
                          }}
                        >
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">{section.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {section.articles.length} articles
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedArticle ? (
                /* Article View */
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <button 
                        onClick={() => setSelectedArticle(null)}
                        className="text-primary hover:underline"
                      >
                        ← Back to articles
                      </button>
                    </div>
                    <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
                    <CardDescription>{selectedArticle.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: selectedArticle.content
                          .replace(/^#\s(.+)/gm, '<h1>$1</h1>')
                          .replace(/^##\s(.+)/gm, '<h2>$1</h2>')
                          .replace(/\n/g, '<br>')
                      }} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Articles Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredArticles.map((article) => (
                    <Card 
                      key={article.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2 text-xs">
                              {article.category}
                            </Badge>
                            <CardTitle className="text-lg">{article.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {article.description}
                            </CardDescription>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Docs;