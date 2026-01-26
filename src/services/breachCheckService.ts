/**
 * Breach Check Service
 * Uses HaveIBeenPwned APIs to check passwords and emails against breaches
 */

export interface PasswordBreachResult {
  breached: boolean;
  count: number;
}

export interface EmailBreachResult {
  breached: boolean;
  breaches: {
    name: string;
    domain: string;
    breachDate: string;
    dataClasses: string[];
  }[];
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
   * Uses HIBP breached account API (free for unverified searches)
   */
  static async checkEmail(email: string): Promise<EmailBreachResult> {
    try {
      // Use the public breach search endpoint
      const response = await fetch(
        `https://haveibeenpwned.com/unifiedsearch/${encodeURIComponent(email)}`,
        {
          headers: {
            'User-Agent': 'SafePass-BreachMonitor',
          }
        }
      );
      
      if (response.status === 404) {
        // No breaches found
        return { breached: false, breaches: [] };
      }
      
      if (!response.ok) {
        console.error('HIBP email check error:', response.status);
        return { breached: false, breaches: [] };
      }
      
      const data = await response.json();
      const breaches = (data.Breaches || []).map((b: any) => ({
        name: b.Name,
        domain: b.Domain,
        breachDate: b.BreachDate,
        dataClasses: b.DataClasses || []
      }));
      
      return { breached: breaches.length > 0, breaches };
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
   * Batch check multiple emails
   */
  static async checkEmails(emails: { id: string; email: string }[]): Promise<Map<string, EmailBreachResult>> {
    const results = new Map<string, EmailBreachResult>();
    
    // Rate limit: 1 request per 1.5 seconds for HIBP
    for (const { id, email } of emails) {
      if (!email || !email.includes('@')) {
        results.set(id, { breached: false, breaches: [] });
        continue;
      }
      
      const result = await this.checkEmail(email);
      results.set(id, result);
      
      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1600));
    }
    
    return results;
  }
}
