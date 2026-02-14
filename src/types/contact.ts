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
  { id: 'vanguard', name: 'Vanguard', description: 'RMM, helpdesk, pentesting & IT operations' },
  { id: 'safesuite', name: 'SafeSuite', description: 'Password manager, email security & digital protection' },
  { id: 'ai-studio', name: 'AI Studio', description: 'Build custom AI assistants & GPTs' },
  { id: 'custom-apps', name: 'Custom App Development', description: 'Bespoke AI-powered applications' },
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
