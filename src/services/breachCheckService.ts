/**
 * Breach Check Service
 * Uses HaveIBeenPwned APIs and Dehashed via edge function to check passwords and emails against breaches
 */

import { supabase } from '@/integrations/supabase/client';

export interface PasswordBreachResult {
  breached: boolean;
  count: number;
}

export interface LeakedCredential {
  database_name: string;
  email?: string;
  username?: string;
  password?: string;
  hashed_password?: string;
  name?: string;
  phone?: string;
  address?: string;
}

export interface EmailBreachResult {
  breached: boolean;
  breaches: {
    name: string;
    domain: string;
    breachDate: string;
    dataClasses: string[];
  }[];
  leakedData?: LeakedCredential[];
  dehashedTotal?: number;
}

export class BreachCheckService {
  /**
   * Check if a password has been exposed in data breaches
   * Uses SHA-1 hash with k-anonymity (only sends first 5 chars of hash)
   */
  static async checkPassword(password: string): Promise<PasswordBreachResult> {
    try {
      // Generate SHA-1 hash of password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      // k-anonymity: send only first 5 characters
      const prefix = hashHex.substring(0, 5);
      const suffix = hashHex.substring(5);
      
      // Query HIBP Pwned Passwords API
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: {
          'Add-Padding': 'true',
        }
      });
      
      if (!response.ok) {
        console.error('HIBP API error:', response.status);
        return { breached: false, count: 0 };
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        const [hashSuffix, countStr] = line.split(':');
        if (hashSuffix?.trim() === suffix) {
          const count = parseInt(countStr?.trim() || '0', 10);
          return { breached: true, count };
        }
      }
      
      return { breached: false, count: 0 };
    } catch (error) {
      console.error('Breach check failed:', error);
      return { breached: false, count: 0 };
    }
  }

  /**
   * Check if an email has been exposed in data breaches
   * Uses dark-web-monitor edge function for HIBP + Dehashed data
   */
  static async checkEmail(email: string, userId?: string): Promise<EmailBreachResult> {
    try {
      // Use edge function for comprehensive breach check (HIBP + Dehashed)
      const { data, error } = await supabase.functions.invoke('dark-web-monitor', {
        body: { 
          action: 'check_email', 
          email,
          user_id: userId
        }
      });
      
      if (error) {
        console.error('Dark web monitor error:', error);
        return { breached: false, breaches: [] };
      }
      
      const breaches = (data.breaches || []).map((b: any) => ({
        name: b.name || b.Name,
        domain: b.domain || b.Domain,
        breachDate: b.breach_date || b.BreachDate,
        dataClasses: b.data_classes || b.DataClasses || []
      }));
      
      return { 
        breached: breaches.length > 0 || (data.leakedData?.length || 0) > 0, 
        breaches,
        leakedData: data.leakedData || [],
        dehashedTotal: data.dehashedTotal || 0
      };
    } catch (error) {
      console.error('Email breach check failed:', error);
      return { breached: false, breaches: [] };
    }
  }
  
  /**
   * Batch check multiple passwords
   */
  static async checkPasswords(passwords: { id: string; password: string }[]): Promise<Map<string, PasswordBreachResult>> {
    const results = new Map<string, PasswordBreachResult>();
    
    const batchSize = 5;
    for (let i = 0; i < passwords.length; i += batchSize) {
      const batch = passwords.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async ({ id, password }) => {
          const result = await this.checkPassword(password);
          return { id, result };
        })
      );
      
      for (const { id, result } of batchResults) {
        results.set(id, result);
      }
      
      if (i + batchSize < passwords.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Batch check multiple emails - uses edge function with auto-retry
   */
  static async checkEmails(emails: { id: string; email: string }[], userId?: string): Promise<Map<string, EmailBreachResult>> {
    const results = new Map<string, EmailBreachResult>();
    
    for (const { id, email } of emails) {
      if (!email || !email.includes('@')) {
        results.set(id, { breached: false, breaches: [] });
        continue;
      }
      
      // Try with auto-retry on first failure (handles cold start)
      let result = await this.checkEmail(email, userId);
      if (!result.breached && result.breaches.length === 0) {
        // Retry once in case of cold start failure
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await this.checkEmail(email, userId);
      }
      
      results.set(id, result);
      
      // Rate limit between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }
}
