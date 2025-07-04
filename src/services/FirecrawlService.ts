interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static supabaseEdgeFunctionUrl = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/web-crawler';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('Firecrawl API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing Firecrawl API key');
      const response = await fetch(this.supabaseEdgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          apiKey: apiKey
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async crawlWebsite(url: string, gptId?: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Making crawl request via Supabase Edge Function');
      
      const response = await fetch(this.supabaseEdgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'crawl',
          url: url,
          gptId: gptId,
          options: {
            limit: 50,
            scrapeOptions: {
              formats: ['markdown', 'html'],
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('Crawl failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'Failed to crawl website' 
        };
      }

      console.log('Crawl successful:', result);
      return { 
        success: true,
        data: result.data 
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to crawler service' 
      };
    }
  }

  static async scrapeUrl(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Making scrape request via Supabase Edge Function');
      
      const response = await fetch(this.supabaseEdgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'scrape',
          url: url,
          options: {
            formats: ['markdown', 'html'],
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('Scrape failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'Failed to scrape website' 
        };
      }

      console.log('Scrape successful');
      return { 
        success: true,
        data: result.data 
      };
    } catch (error) {
      console.error('Error during scrape:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to scraper service' 
      };
    }
  }
}