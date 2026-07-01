/**
 * VaultAI Smart Search - AI-powered credential search with intelligent suggestions
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useVaultAI } from '@/hooks/useVaultAI';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Search, 
  Sparkles, 
  Globe, 
  Star, 
  Clock, 
  TrendingUp,
  Zap,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface VaultAISearchProps {
  entries: PasswordEntry[];
  onSelect: (entry: PasswordEntry) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function VaultAISearch({
  entries,
  onSelect,
  onSearch,
  placeholder = "Search passwords...",
  className,
}: VaultAISearchProps) {
  const { isEnabled, smartSearch, recordSelection, extractDomain } = useVaultAI();
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get AI-powered search results
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      // Show top suggestions when no query
      return smartSearch(entries, '', undefined).slice(0, 6);
    }
    return smartSearch(entries, query, undefined).slice(0, 10);
  }, [entries, query, smartSearch]);
  
  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };
  
  const handleSelect = (entry: PasswordEntry) => {
    // Record selection for AI learning
    recordSelection(entry);
    onSelect(entry);
    setQuery('');
    setIsOpen(false);
  };
  
  const handleInputChange = (value: string) => {
    setQuery(value);
    onSearch(value);
    if (value.trim()) {
      setIsOpen(true);
    }
  };
  
  const getMatchIcon = (reasons: string[]) => {
    if (reasons.includes('Your preferred choice')) return <Star className="h-3 w-3 text-primary" />;
    if (reasons.includes('Frequently used')) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (reasons.includes('Recently used')) return <Clock className="h-3 w-3 text-blue-500" />;
    if (reasons.includes('Current site match')) return <Zap className="h-3 w-3 text-purple-500" />;
    return null;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => entries.length > 0 && setIsOpen(true)}
            className="pl-10 pr-10 bg-muted border-primary/20 focus:border-primary text-white placeholder:text-gray-500"
          />
          {isEnabled && (
            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
          )}
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-transparent"
              onClick={() => {
                setQuery('');
                onSearch('');
              }}
            >
              <X className="h-3 w-3 text-gray-500" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-muted border-primary/20"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {searchResults.length > 0 ? (
          <ScrollArea className="max-h-[300px]">
            <div className="py-1">
              {!query && isEnabled && (
                <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2 border-b border-primary/10">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>AI Suggestions</span>
                </div>
              )}
              
              {searchResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                    index === selectedIndex 
                      ? "bg-primary/20" 
                      : "hover:bg-primary/10"
                  )}
                >
                  <div className="h-8 w-8 rounded-lg bg-[#252525] flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-200 truncate">
                        {result.title}
                      </span>
                      {result.is_favorite && (
                        <Star className="h-3 w-3 text-primary fill-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 truncate">
                        {result.username}
                      </span>
                      {result.website && (
                        <>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-600 truncate">
                            {extractDomain(result.website)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {getMatchIcon(result.matchReasons)}
                    {result.relevanceScore > 70 && isEnabled && (
                      <Badge 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary"
                      >
                        {result.relevanceScore}%
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            {query ? 'No passwords found' : 'No passwords yet'}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
