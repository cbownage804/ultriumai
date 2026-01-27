// SafePass Demo Mock Data - Extracted for maintainability

export interface PasswordEntry {
  id: number;
  site: string;
  username: string;
  password: string;
  strength: number;
  shared: boolean;
  lastUsed: string;
}

export interface BreachRecord {
  site: string;
  accounts: number;
  date: string;
  status: 'affected' | 'clear' | 'monitoring';
}

export const mockPasswords: PasswordEntry[] = [
  { 
    id: 1, 
    site: 'Microsoft 365', 
    username: 'admin@company.com', 
    password: 'Secure123!@#$%', 
    strength: 92, 
    shared: true,
    lastUsed: '2 hours ago'
  },
  { 
    id: 2, 
    site: 'AWS Console', 
    username: 'root', 
    password: 'Aws#Complex789$', 
    strength: 98, 
    shared: false,
    lastUsed: '1 day ago'
  },
  { 
    id: 3, 
    site: 'Company Database', 
    username: 'db_admin', 
    password: 'Simple123', 
    strength: 45, 
    shared: true,
    lastUsed: '5 min ago'
  },
  { 
    id: 4, 
    site: 'Salesforce', 
    username: 'sales@company.com', 
    password: 'StrongPass2024!', 
    strength: 95, 
    shared: true,
    lastUsed: '30 min ago'
  }
];

export const mockBreaches: BreachRecord[] = [
  { site: 'LinkedInBreach2021', accounts: 700000000, date: '2021-06-01', status: 'affected' },
  { site: 'Facebook2019', accounts: 533000000, date: '2019-04-01', status: 'clear' },
  { site: 'Twitter2022', accounts: 5400000, date: '2022-08-01', status: 'monitoring' }
];

export const teamStats = {
  members: 24,
  sharedPasswords: 156,
  mfaEnabled: 98,
  locations: 12
};

export const teamGroups = [
  { name: 'IT Administrators', members: 5, access: 'Full access', icon: 'Users', color: 'primary' },
  { name: 'Sales Team', members: 12, access: 'Limited access', icon: 'Building', color: 'info' },
  { name: 'HR Department', members: 7, access: 'Department access', icon: 'Users', color: 'warning' }
];
