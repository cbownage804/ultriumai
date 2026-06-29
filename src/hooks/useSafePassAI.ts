/**
 * Hook for VaultAI - intelligent credential matching and learning
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website: string;
  category: string;
  is_favorite: boolean;
  password_strength: number;
  usage_count?: number;
  last_used_at?: string;
}

interface SearchResult extends PasswordEntry {
  relevanceScore: number;
  matchReasons: string[];
}

interface DomainPreference {
  domain: string;
  preferredEntryId: string;
  selectionCount: number;
}

const PREFERENCES_KEY = 'safepass_ai_preferences';

export function useVaultAI() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      return localStorage.getItem('safepass_ai_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  const [learnPatterns, setLearnPatterns] = useState(() => {
    try {
      return localStorage.getItem('safepass_ai_learn') !== 'false';
    } catch {
      return true;
    }
  });

  // Get local preferences
  const getLocalPreferences = useCallback((): Record<string, DomainPreference> => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  // Save local preferences
  const saveLocalPreference = useCallback((domain: string, entryId: string) => {
    const prefs = getLocalPreferences();
    const existing = prefs[domain];
    prefs[domain] = {
      domain,
      preferredEntryId: entryId,
      selectionCount: (existing?.selectionCount || 0) + 1,
    };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  }, [getLocalPreferences]);

  // Extract domain from URL
  const extractDomain = useCallback((url: string): string => {
    try {
      if (!url) return '';
      if (!url.includes('://')) url = 'https://' + url;
      const hostname = new URL(url).hostname;
      // Remove www. prefix
      return hostname.replace(/^www\./, '');
    } catch {
      // Fallback for invalid URLs
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
  }, []);

  // Fuzzy match score (0-100)
  const fuzzyMatch = useCallback((query: string, target: string): number => {
    if (!query || !target) return 0;
    
    const q = query.toLowerCase();
    const t = target.toLowerCase();
    
    // Exact match
    if (t === q) return 100;
    
    // Contains match
    if (t.includes(q)) return 80;
    
    // Word boundary match
    const words = t.split(/[\s\-_./]+/);
    for (const word of words) {
      if (word.startsWith(q)) return 70;
    }
    
    // Character sequence match (for typos)
    let matches = 0;
    let lastIndex = -1;
    for (const char of q) {
      const index = t.indexOf(char, lastIndex + 1);
      if (index > lastIndex) {
        matches++;
        lastIndex = index;
      }
    }
    const seqScore = (matches / q.length) * 50;
    
    return Math.round(seqScore);
  }, []);

  // Smart search with AI ranking
  const smartSearch = useCallback((
    entries: PasswordEntry[],
    query: string,
    contextUrl?: string
  ): SearchResult[] => {
    if (!isEnabled || entries.length === 0) {
      // Return basic filtered results without AI ranking
      if (!query) return entries.map(e => ({ ...e, relevanceScore: 50, matchReasons: [] }));
      
      return entries
        .filter(e => 
          e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.username.toLowerCase().includes(query.toLowerCase()) ||
          e.website.toLowerCase().includes(query.toLowerCase())
        )
        .map(e => ({ ...e, relevanceScore: 50, matchReasons: ['Basic match'] }));
    }

    const prefs = getLocalPreferences();
    const contextDomain = contextUrl ? extractDomain(contextUrl) : '';
    
    const results: SearchResult[] = entries.map(entry => {
      let score = 0;
      const matchReasons: string[] = [];
      
      // 1. Title match (up to 30 points)
      const titleScore = fuzzyMatch(query, entry.title);
      if (titleScore > 0) {
        score += Math.round(titleScore * 0.3);
        matchReasons.push(`Title: ${entry.title}`);
      }
      
      // 2. Username match (up to 20 points)
      const usernameScore = fuzzyMatch(query, entry.username);
      if (usernameScore > 0) {
        score += Math.round(usernameScore * 0.2);
        matchReasons.push(`Username: ${entry.username}`);
      }
      
      // 3. Website/domain match (up to 25 points)
      const entryDomain = extractDomain(entry.website);
      const websiteScore = Math.max(
        fuzzyMatch(query, entry.website),
        fuzzyMatch(query, entryDomain)
      );
      if (websiteScore > 0) {
        score += Math.round(websiteScore * 0.25);
        matchReasons.push(`Website: ${entry.website}`);
      }
      
      // 4. Context URL match bonus (up to 15 points)
      if (contextDomain && entryDomain) {
        if (entryDomain === contextDomain) {
          score += 15;
          matchReasons.push('Current site match');
        } else if (entryDomain.includes(contextDomain) || contextDomain.includes(entryDomain)) {
          score += 10;
          matchReasons.push('Similar domain');
        }
      }
      
      // 5. Learned preference boost (up to 10 points)
      const domainPref = prefs[entryDomain];
      if (domainPref && domainPref.preferredEntryId === entry.id) {
        const prefBoost = Math.min(10, domainPref.selectionCount * 2);
        score += prefBoost;
        matchReasons.push('Your preferred choice');
      }
      
      // 6. Usage frequency boost (up to 10 points)
      if (entry.usage_count && entry.usage_count > 0) {
        const usageBoost = Math.min(10, Math.log10(entry.usage_count + 1) * 5);
        score += Math.round(usageBoost);
        matchReasons.push('Frequently used');
      }
      
      // 7. Recency boost (up to 5 points)
      if (entry.last_used_at) {
        const daysSinceUse = (Date.now() - new Date(entry.last_used_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUse < 7) {
          score += 5;
          matchReasons.push('Recently used');
        } else if (daysSinceUse < 30) {
          score += 3;
        }
      }
      
      // 8. Favorite boost (5 points)
      if (entry.is_favorite) {
        score += 5;
        matchReasons.push('Favorite');
      }
      
      return {
        ...entry,
        relevanceScore: Math.min(100, score),
        matchReasons,
      };
    });
    
    // Sort by relevance score, then alphabetically
    return results
      .filter(r => !query || r.relevanceScore > 0)
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return a.title.localeCompare(b.title);
      });
  }, [isEnabled, getLocalPreferences, extractDomain, fuzzyMatch]);

  // Record user selection for learning
  const recordSelection = useCallback(async (entry: PasswordEntry, contextUrl?: string) => {
    if (!learnPatterns || !user) return;
    
    const domain = contextUrl ? extractDomain(contextUrl) : extractDomain(entry.website);
    
    // Save locally for immediate effect
    if (domain) {
      saveLocalPreference(domain, entry.id);
    }
    
    // Update usage count in database - use direct query since types may not be regenerated yet
    try {
      await supabase
        .from('safepass_entries')
        .update({ 
          usage_count: (entry.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', entry.id);
    } catch (error) {
      console.error('Error updating usage count:', error);
    }
    
    // Save to database for cross-device sync
    if (domain) {
      try {
        await supabase
          .from('safepass_user_preferences')
          .upsert({
            user_id: user.id,
            preference_type: 'domain_preference',
            preference_key: domain,
            preference_value: { entry_id: entry.id },
            usage_count: 1,
            last_used_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,preference_type,preference_key',
          });
      } catch (error) {
        console.error('Error saving preference:', error);
      }
    }
  }, [learnPatterns, user, extractDomain, saveLocalPreference]);

  // Get suggestions for a URL
  const getSuggestionsForUrl = useCallback((
    entries: PasswordEntry[],
    url: string,
    limit: number = 5
  ): SearchResult[] => {
    const domain = extractDomain(url);
    if (!domain) return [];
    
    return smartSearch(entries, domain, url).slice(0, limit);
  }, [extractDomain, smartSearch]);

  // Clear all learned patterns
  const clearPatterns = useCallback(async () => {
    // Clear local storage
    localStorage.removeItem(PREFERENCES_KEY);
    
    // Clear from database
    if (user) {
      try {
        await supabase
          .from('safepass_user_preferences')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error clearing preferences:', error);
      }
    }
  }, [user]);

  // Toggle AI features
  const toggleEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('safepass_ai_enabled', String(enabled));
  }, []);

  const toggleLearnPatterns = useCallback((learn: boolean) => {
    setLearnPatterns(learn);
    localStorage.setItem('safepass_ai_learn', String(learn));
  }, []);

  return {
    isEnabled,
    learnPatterns,
    toggleEnabled,
    toggleLearnPatterns,
    smartSearch,
    recordSelection,
    getSuggestionsForUrl,
    clearPatterns,
    extractDomain,
  };
}
