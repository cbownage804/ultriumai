/**
 * Breach Check Service
 * Uses HaveIBeenPwned's k-anonymity API to check if passwords appear in breaches
 * without exposing the actual password
 */

export class BreachCheckService {
  /**
   * Check if a password has been exposed in data breaches
   * Uses SHA-1 hash with k-anonymity (only sends first 5 chars of hash)
   */
  static async checkPassword(password: string): Promise<{ breached: boolean; count: number }> {
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
          'Add-Padding': 'true', // Adds padding to prevent timing attacks
        }
      });
      
      if (!response.ok) {
        console.error('HIBP API error:', response.status);
        return { breached: false, count: 0 };
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      
      // Check if our hash suffix is in the response
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
   * Batch check multiple passwords
   */
  static async checkPasswords(passwords: { id: string; password: string }[]): Promise<Map<string, { breached: boolean; count: number }>> {
    const results = new Map<string, { breached: boolean; count: number }>();
    
    // Process in parallel with rate limiting (max 5 concurrent)
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
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < passwords.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}
