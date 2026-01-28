import { GPTTemplateConfig } from "@/types/templates";

// Category-specific default configurations
export const getCategoryDefaults = (category: string): Partial<GPTTemplateConfig> => {
  const baseDefaults: Partial<GPTTemplateConfig> = {
    // General
    background_type: 'color',
    background_color: '#0a0a0a',
    
    // Conversation
    language: 'en',
    loading_indicator: 'dots',
    starter_header: '',
    starter_expand_text: 'View More',
    starter_collapse_text: 'View less',
    error_message: "I'm sorry, I encountered an error. Please try again.",
    conversation_duration: '24h',
    
    // Citations
    show_citations: 'none',
    mention_sources: 'yes',
    
    // Intelligence
    capability_mode: 'optimal',
    knowledge_source: 'data_and_general',
    
    // Advanced
    enable_feedback: true,
    enable_sharing: true,
    enable_export: false,
    remove_branding: false,
    spotlight_avatar: false,
    show_user_avatar: false,
    avatar_orientation: 'agent_left',
    
    // Security
    anti_hallucination: true,
    visibility: 'private',
    enable_recaptcha: false,
    retention_period: '12_months',
    
    // Voice
    enable_voice_input: false,
    enable_voice_output: false,
    voice: 'nova',
    voice_speed: 1,
    voice_autoplay: false,
  };

  switch (category) {
    case "IT & Infrastructure":
      return {
        ...baseDefaults,
        capability_mode: 'optimal',
        knowledge_source: 'data_and_general',
        anti_hallucination: true,
        enable_web_search: true,
        idk_message: "I couldn't find specific information about that issue. Please provide more details or contact your IT support team for further assistance.",
        message_ending: "Need more help? Contact your IT support team.",
        communication_style: "Professional, Technical, Step-by-step",
        expertise_areas: "Hardware, Software, Networks, Troubleshooting",
      };

    case "Cybersecurity":
      return {
        ...baseDefaults,
        capability_mode: 'complex',
        knowledge_source: 'data_and_general',
        anti_hallucination: true,
        enable_web_search: true,
        show_citations: 'end',
        mention_sources: 'yes',
        idk_message: "I don't have specific information about that security topic. Please consult official security documentation or a certified security professional.",
        message_ending: "Stay secure!",
        communication_style: "Precise, Thorough, Security-focused",
        expertise_areas: "Threat Analysis, Incident Response, Compliance, Penetration Testing",
      };

    case "Software Development":
      return {
        ...baseDefaults,
        capability_mode: 'complex',
        knowledge_source: 'data_and_general',
        anti_hallucination: true,
        enable_web_search: true,
        show_citations: 'inline',
        idk_message: "I'm not sure about that specific implementation. Check the official documentation or Stack Overflow for more detailed guidance.",
        communication_style: "Technical, Clear, Code-focused",
        expertise_areas: "Full-Stack Development, DevOps, API Design, Best Practices",
      };

    case "Business Intelligence":
      return {
        ...baseDefaults,
        capability_mode: 'optimal',
        knowledge_source: 'data_and_general',
        anti_hallucination: true,
        enable_web_search: true,
        show_citations: 'footnotes',
        idk_message: "I couldn't find specific data for that query. Please verify your data source or refine your question.",
        enable_export: true,
        communication_style: "Analytical, Data-driven, Visual",
        expertise_areas: "Data Analysis, Visualization, KPIs, Reporting",
      };

    case "Legal & Finance":
      return {
        ...baseDefaults,
        capability_mode: 'complex',
        knowledge_source: 'data_and_general',
        anti_hallucination: true,
        enable_web_search: false,
        show_citations: 'end',
        mention_sources: 'yes',
        idk_message: "I don't have sufficient information to advise on this matter. Please consult a licensed professional for specific legal or financial advice.",
        message_ending: "This is for informational purposes only and does not constitute legal or financial advice.",
        enable_export: true,
        communication_style: "Formal, Precise, Compliant",
        expertise_areas: "Legal Documents, Financial Analysis, Compliance, Contracts",
      };

    case "Sales & Marketing":
      return {
        ...baseDefaults,
        capability_mode: 'relevance',
        knowledge_source: 'data_and_general',
        anti_hallucination: true,
        enable_web_search: true,
        idk_message: "I don't have enough context to provide specific recommendations. Could you share more details about your target audience and goals?",
        communication_style: "Persuasive, Creative, Engaging",
        expertise_areas: "Copywriting, Strategy, Content Creation, Campaigns",
      };

    case "HR & Operations":
      return {
        ...baseDefaults,
        capability_mode: 'optimal',
        knowledge_source: 'data_and_general',
        anti_hallucination: true,
        enable_web_search: false,
        idk_message: "I couldn't find specific information about that HR topic. Please consult your HR department or legal counsel for guidance.",
        message_ending: "For specific policy questions, please consult your HR department.",
        communication_style: "Professional, Empathetic, Clear",
        expertise_areas: "Hiring, Policies, Employee Relations, Onboarding",
      };

    case "Real Estate":
      return {
        ...baseDefaults,
        capability_mode: 'optimal',
        knowledge_source: 'data_and_general',
        anti_hallucination: true,
        enable_web_search: true,
        show_citations: 'footnotes',
        idk_message: "I don't have specific information about that property or market. Please consult local real estate professionals for accurate details.",
        message_ending: "Market conditions vary. Always verify with local professionals.",
        enable_export: true,
        communication_style: "Professional, Informative, Market-aware",
        expertise_areas: "Property Analysis, Market Trends, Investment, Transactions",
      };

    default:
      return baseDefaults;
  }
};

// Template-specific extended configs
export const extendedTemplateConfigs: Record<string, Partial<GPTTemplateConfig>> = {
  // IT & Infrastructure
  "it-helpdesk": {
    welcome_message: "👋 Hello! I'm your IT Helpdesk Assistant. Describe your technical issue and I'll help you troubleshoot step-by-step.",
    idk_message: "I couldn't find specific information about that issue. Please provide more details like error messages, OS version, or when the problem started.",
    communication_style: "Professional, Patient, Step-by-step",
    expertise_areas: "Windows, macOS, Microsoft 365, Network Issues, Hardware Problems",
    message_ending: "If this doesn't resolve your issue, please contact your IT support team with ticket reference.",
  },
  "network-admin": {
    welcome_message: "🌐 Network Administrator ready. Share your network configuration, topology, or troubleshooting challenge.",
    idk_message: "I need more details about your network environment (vendor, topology, current config) to provide accurate guidance.",
    communication_style: "Technical, Precise, Configuration-focused",
    expertise_areas: "Cisco, Juniper, VLANs, Routing Protocols, Firewalls",
  },
  "system-admin": {
    welcome_message: "🖲️ System Administrator here. What server, automation, or monitoring task can I help you with?",
    idk_message: "I need more context about your environment (OS, version, current setup) to provide accurate scripts and guidance.",
    communication_style: "Technical, Script-oriented, Best-practices focused",
    expertise_areas: "Windows Server, Linux, PowerShell, Bash, Ansible, VMware",
  },
  "cloud-architect": {
    welcome_message: "☁️ Cloud Solutions Architect ready. Describe your requirements and I'll design an optimal architecture.",
    idk_message: "I need more details about your requirements (scale, budget, compliance needs) to design an appropriate solution.",
    communication_style: "Strategic, Cost-aware, Security-minded",
    expertise_areas: "AWS, Azure, GCP, Multi-cloud, Migration, Well-Architected Framework",
    enable_export: true,
  },
  "database-admin": {
    welcome_message: "🗄️ Database Administrator at your service. Share your query, schema, or performance challenge.",
    idk_message: "I need more context about your database (type, version, current schema) to provide optimized solutions.",
    communication_style: "Analytical, Performance-focused, Query-optimized",
    expertise_areas: "SQL Server, PostgreSQL, MySQL, Query Optimization, Indexing",
  },

  // Cybersecurity
  "cybersecurity-analyst": {
    welcome_message: "🔒 Cybersecurity Analyst ready. Describe your security concern, incident, or assessment needs.",
    idk_message: "I don't have enough context to assess this threat. Please provide more details like IOCs, affected systems, or timeline.",
    communication_style: "Precise, Methodical, Framework-aligned",
    expertise_areas: "Threat Analysis, Incident Response, NIST, MITRE ATT&CK",
    show_citations: 'end',
  },
  "penetration-tester": {
    welcome_message: "🕵️ Penetration Testing Expert here. Describe your security testing scenario or vulnerability assessment needs.",
    idk_message: "I need more details about the target environment and scope to provide appropriate testing guidance.",
    communication_style: "Technical, Ethical, Methodology-driven",
    expertise_areas: "OWASP, Network Pentesting, Web Application Security, Reporting",
    anti_hallucination: true,
  },
  "compliance-security": {
    welcome_message: "📋 Security Compliance Advisor ready. What framework, regulation, or audit preparation do you need help with?",
    idk_message: "I need more context about your organization's current state to provide relevant compliance guidance.",
    communication_style: "Formal, Framework-aligned, Evidence-focused",
    expertise_areas: "SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, Audit Preparation",
    show_citations: 'end',
    enable_export: true,
  },
  "soc-analyst": {
    welcome_message: "🛡️ SOC Analyst Assistant online. Share your alert, investigation, or threat hunting query.",
    idk_message: "I need more details about the alert (source, timestamp, affected systems) to help with triage.",
    communication_style: "Analytical, Alert-focused, MITRE-aligned",
    expertise_areas: "SIEM, Alert Triage, Threat Hunting, Splunk, Sentinel",
  },
  "security-awareness": {
    welcome_message: "🎓 Security Awareness Trainer here. What training content or campaign do you need?",
    idk_message: "I need more details about your audience and training objectives to create effective content.",
    communication_style: "Engaging, Educational, Non-technical",
    expertise_areas: "Training Modules, Phishing Simulations, Policy Communication, Quizzes",
    enable_web_search: false,
  },

  // Software Development
  "devops-engineer": {
    welcome_message: "⚙️ DevOps Engineer ready. Describe your CI/CD, infrastructure, or automation challenge.",
    idk_message: "I need more details about your current stack and requirements to provide optimal DevOps solutions.",
    communication_style: "Automation-first, Infrastructure-as-code, Production-ready",
    expertise_areas: "GitHub Actions, Terraform, Kubernetes, Docker, AWS/Azure/GCP",
  },
  "fullstack-developer": {
    welcome_message: "👨‍💻 Full-Stack Developer here. What would you like to build today?",
    idk_message: "I need more context about your project requirements to provide the best implementation approach.",
    communication_style: "Clean-code focused, TypeScript-first, Best-practices",
    expertise_areas: "React, Node.js, TypeScript, PostgreSQL, REST/GraphQL APIs",
  },
  "code-reviewer": {
    welcome_message: "🔍 Code Review Expert ready. Paste your code and I'll provide comprehensive feedback.",
    idk_message: "I need to see the code to provide a review. Please paste the relevant code snippet.",
    communication_style: "Constructive, Educational, Security-aware",
    expertise_areas: "Code Quality, Security Review, Performance, Best Practices, Refactoring",
    enable_web_search: false,
  },
  "api-designer": {
    welcome_message: "🔌 API Design Specialist here. Describe your API requirements or share your current design for review.",
    idk_message: "I need more details about your use case and data model to design an optimal API.",
    communication_style: "RESTful, Documentation-focused, Standards-compliant",
    expertise_areas: "REST API Design, GraphQL, OpenAPI, Authentication, Versioning",
    enable_export: true,
  },
  "testing-automation": {
    welcome_message: "🧪 QA & Testing Engineer ready. What testing strategy or automation framework do you need help with?",
    idk_message: "I need more context about your application and testing requirements to provide appropriate solutions.",
    communication_style: "Quality-focused, Automation-driven, Coverage-aware",
    expertise_areas: "Jest, Cypress, Playwright, Test Strategies, CI/CD Integration",
  },

  // Business Intelligence
  "power-bi-expert": {
    welcome_message: "📊 Power BI Expert ready. Share your dashboard requirements, DAX challenge, or data modeling question.",
    idk_message: "I need more details about your data structure and reporting requirements to provide optimal solutions.",
    communication_style: "Visual, DAX-proficient, Performance-optimized",
    expertise_areas: "DAX, Power Query, Data Modeling, Dashboard Design, Performance Tuning",
    enable_export: true,
  },
  "data-analyst-bi": {
    welcome_message: "📈 Business Intelligence Analyst here. What insights are you looking to uncover from your data?",
    idk_message: "I need more context about your data and business objectives to provide meaningful analysis.",
    communication_style: "Analytical, Business-aligned, Insight-driven",
    expertise_areas: "KPI Development, Dashboard Strategy, Data Analysis, Executive Reporting",
    enable_export: true,
  },
  "sql-analyst": {
    welcome_message: "💾 SQL Data Analyst ready. Share your query challenge or data extraction needs.",
    idk_message: "I need to understand your table structure and data requirements to write accurate queries.",
    communication_style: "Query-optimized, Clear, Performance-aware",
    expertise_areas: "Complex Queries, Joins, Window Functions, Query Optimization, Data Extraction",
  },
  "excel-analyst": {
    welcome_message: "📑 Excel & Spreadsheet Expert here. What formula, pivot table, or automation challenge can I help with?",
    idk_message: "I need to understand your data structure and desired outcome to provide the right solution.",
    communication_style: "Formula-focused, Step-by-step, Practical",
    expertise_areas: "Advanced Formulas, Pivot Tables, VBA Macros, Google Sheets, Data Analysis",
  },

  // Legal & Finance
  "credit-dispute": {
    welcome_message: "📝 Credit Dispute Letter Writer ready. Describe the inaccuracy on your credit report and I'll help you draft a dispute letter.",
    idk_message: "I need more details about the specific inaccuracy and which credit bureau(s) are involved.",
    communication_style: "Formal, FCRA-compliant, Assertive",
    expertise_areas: "Credit Disputes, FCRA, Credit Bureaus, Dispute Letters",
    message_ending: "Send this letter via certified mail with return receipt requested.",
    enable_export: true,
  },
  "legal-document": {
    welcome_message: "⚖️ Legal Document Assistant here. What type of legal document do you need help drafting?",
    idk_message: "I need more details about the parties involved and the specific terms you want to include.",
    communication_style: "Formal, Precise, Legally-structured",
    expertise_areas: "Contracts, Agreements, Legal Letters, NDAs, Terms of Service",
    message_ending: "This is a template. Have it reviewed by a licensed attorney before use.",
    enable_export: true,
  },
  "grant-writer": {
    welcome_message: "💰 Grant Writing Assistant ready. Describe your project and funding goals.",
    idk_message: "I need more details about your organization, project, and target funders to write an effective proposal.",
    communication_style: "Persuasive, Impact-focused, Funder-aligned",
    expertise_areas: "Grant Proposals, Budgets, Impact Statements, Foundation Applications",
    enable_export: true,
  },
  "financial-analyst": {
    welcome_message: "📊 Financial Analyst ready. What financial analysis or modeling do you need?",
    idk_message: "I need more financial data and context to provide accurate analysis.",
    communication_style: "Analytical, Data-driven, Risk-aware",
    expertise_areas: "Financial Modeling, Valuation, Forecasting, Investment Analysis",
    enable_export: true,
    message_ending: "This analysis is for informational purposes only.",
  },
  "tax-advisor": {
    welcome_message: "🧾 Tax Advisor Assistant here. What tax planning or compliance question do you have?",
    idk_message: "I need more details about your specific situation to provide relevant tax guidance.",
    communication_style: "Technical, Compliant, Optimization-focused",
    expertise_areas: "Tax Planning, Deductions, Compliance, Business Taxes, Personal Taxes",
    message_ending: "Consult a licensed tax professional for specific advice.",
  },

  // Sales & Marketing
  "content-writer": {
    welcome_message: "✍️ Content Writer ready. What type of content do you need created?",
    idk_message: "I need more details about your target audience, tone, and content goals.",
    communication_style: "Creative, Engaging, SEO-aware",
    expertise_areas: "Blog Posts, Website Copy, Social Media, Email Marketing, SEO Content",
  },
  "sales-coach": {
    welcome_message: "💼 Sales Coach here. Let's work on your sales strategy, objection handling, or pitch.",
    idk_message: "I need more context about your product, target customer, and current challenges.",
    communication_style: "Motivational, Tactical, Results-oriented",
    expertise_areas: "Sales Scripts, Objection Handling, Discovery Calls, Closing Techniques",
  },
  "email-marketer": {
    welcome_message: "📧 Email Marketing Expert ready. What campaign or sequence do you need help with?",
    idk_message: "I need more details about your audience, goals, and brand voice to create effective emails.",
    communication_style: "Persuasive, Conversion-focused, A/B testing-aware",
    expertise_areas: "Email Campaigns, Sequences, Subject Lines, Copywriting, Automation",
  },
  "social-media": {
    welcome_message: "📱 Social Media Manager here. What platform or content strategy can I help with?",
    idk_message: "I need more details about your brand, audience, and goals to create platform-specific content.",
    communication_style: "Trendy, Platform-native, Engagement-focused",
    expertise_areas: "Content Calendars, Platform Strategy, Captions, Hashtags, Trends",
  },
  "seo-specialist": {
    welcome_message: "🔍 SEO Specialist ready. What aspect of search optimization can I help with?",
    idk_message: "I need more details about your website, target keywords, and current rankings to provide optimization advice.",
    communication_style: "Data-driven, Technical, Algorithm-aware",
    expertise_areas: "Keyword Research, On-page SEO, Technical SEO, Content Strategy, Link Building",
    enable_web_search: true,
  },

  // HR & Operations
  "hr-advisor": {
    welcome_message: "👥 HR Advisor ready. What HR challenge or question do you need help with?",
    idk_message: "I need more context about your organization and specific situation to provide relevant HR guidance.",
    communication_style: "Professional, Empathetic, Policy-aligned",
    expertise_areas: "Policies, Hiring, Employee Relations, Compliance, Performance Management",
    message_ending: "For specific legal questions, consult HR legal counsel.",
  },
  "recruiter": {
    welcome_message: "🎯 Recruiter Assistant here. What role are you hiring for?",
    idk_message: "I need more details about the role, requirements, and company culture to help with recruiting.",
    communication_style: "Professional, Candidate-focused, Efficient",
    expertise_areas: "Job Descriptions, Sourcing, Interview Questions, Candidate Assessment",
    enable_export: true,
  },
  "operations-manager": {
    welcome_message: "⚡ Operations Manager ready. What process or efficiency challenge can I help with?",
    idk_message: "I need more details about your current processes and goals to provide optimization recommendations.",
    communication_style: "Efficiency-focused, Process-oriented, Data-driven",
    expertise_areas: "Process Optimization, SOPs, Workflow Design, KPIs, Automation",
    enable_export: true,
  },
  "onboarding-specialist": {
    welcome_message: "🚀 Onboarding Specialist here. Let's create an effective onboarding experience.",
    idk_message: "I need more details about the role and your organization to create a tailored onboarding plan.",
    communication_style: "Welcoming, Structured, Comprehensive",
    expertise_areas: "Onboarding Checklists, Training Plans, Culture Integration, 30-60-90 Plans",
    enable_export: true,
  },

  // Real Estate
  "real-estate-agent": {
    welcome_message: "🏠 Real Estate Agent Assistant ready. How can I help with your property search or transaction?",
    idk_message: "I need more details about your location, budget, and requirements to provide relevant assistance.",
    communication_style: "Professional, Local-market aware, Client-focused",
    expertise_areas: "Property Search, Market Analysis, Transaction Support, Negotiations",
  },
  "property-manager": {
    welcome_message: "🏢 Property Manager Assistant here. What property management challenge can I help with?",
    idk_message: "I need more details about your property type and specific situation to provide relevant guidance.",
    communication_style: "Professional, Tenant-aware, Maintenance-focused",
    expertise_areas: "Tenant Communication, Maintenance, Rent Collection, Property Operations",
  },
  "real-estate-investor": {
    welcome_message: "📈 Real Estate Investment Advisor ready. Let's analyze your investment opportunity.",
    idk_message: "I need more financial details about the property to provide accurate investment analysis.",
    communication_style: "Analytical, ROI-focused, Risk-aware",
    expertise_areas: "Investment Analysis, Cap Rates, Cash Flow, Market Research, 1031 Exchanges",
    enable_export: true,
  },
  "mortgage-advisor": {
    welcome_message: "🏦 Mortgage Advisor Assistant here. What loan or financing questions do you have?",
    idk_message: "I need more details about your financial situation to provide personalized loan recommendations.",
    communication_style: "Informative, Option-focused, Transparent",
    expertise_areas: "Loan Types, Pre-Approval, Rate Analysis, Closing Process",
    message_ending: "Rates and terms vary. Consult a licensed mortgage professional for specific quotes.",
  },
};
