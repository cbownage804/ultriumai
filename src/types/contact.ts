export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  businessType: string;
  serviceProviderType: string;
  businessSize: string;
  industry: string;
  projectType: string;
  productType: string;
  whiteLabeled: string;
  message: string;
  productInterests: string[];
  // Anti-spam fields (not shown to users)
  _honeypot?: string; // Should always be empty
  _formLoadedAt?: number; // Timestamp when form loaded
}

export interface Product {
  id: string;
  name: string;
}

export const PRODUCTS: Product[] = [
  { id: 'ultriumgpt', name: 'UltriumGPT Platform' },
  { id: 'safeemail', name: 'SafeEmail™' },
  { id: 'safelink', name: 'SafeLink™' },
  { id: 'safedoc', name: 'SafeDoc™' },
  { id: 'safepass', name: 'SafePass™' },
  { id: 'safenet', name: 'SafeNet™' },
  { id: 'safescore', name: 'SafeScore™' },
  { id: 'safeweb', name: 'SafeWeb™' }
];

export const INITIAL_FORM_DATA: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  businessType: '',
  serviceProviderType: '',
  businessSize: '',
  industry: '',
  projectType: '',
  productType: '',
  whiteLabeled: '',
  message: '',
  productInterests: [],
  _honeypot: '',
  _formLoadedAt: Date.now()
};