export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  contactType: string; // 'individual' or 'business'
  businessSize: string;
  industry: string;
  projectType: string;
  message: string;
  productInterests: string[];
  // Anti-spam fields (not shown to users)
  _honeypot?: string;
  _formLoadedAt?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
}

export const PRODUCTS: Product[] = [
  { id: 'wrayth-personal', name: 'Wrayth Personal', description: 'For individuals protecting their identity' },
  { id: 'wrayth-teams', name: 'Wrayth Teams', description: 'For small teams and families' },
  { id: 'wrayth-enterprise', name: 'Wrayth Enterprise', description: 'For organizations with advanced needs' },
  { id: 'vault', name: 'Vault', description: 'Zero-knowledge encrypted password vault' },
  { id: 'scan', name: 'Scan', description: 'Phishing, malware and URL analysis' },
  { id: 'watch', name: 'Watch', description: 'Continuous breach and identity monitoring' },
  { id: 'ray', name: 'Ray AI', description: 'Your AI security teammate' },
  { id: 'api-integrations', name: 'API / Integrations', description: 'Programmatic access and integrations' },
  { id: 'partnership', name: 'Partnership Inquiry', description: 'Reseller, referral or strategic partnership' },
];

export const INITIAL_FORM_DATA: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  contactType: '',
  businessSize: '',
  industry: '',
  projectType: '',
  message: '',
  productInterests: [],
  _honeypot: '',
  _formLoadedAt: Date.now()
};
