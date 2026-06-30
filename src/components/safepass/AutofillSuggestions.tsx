/**
 * AutofillSuggestions - Context-aware credential recommendations panel
 */

import { useMemo } from 'react';
import { useVaultAI } from '@/hooks/useVaultAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Globe, 
  Star, 
  Copy, 
  ExternalLink,
  Zap,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
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

interface AutofillSuggestionsProps {
  entries: PasswordEntry[];
  contextUrl?: string;
  onSelect: (entry: PasswordEntry) => void;
  onCopyPassword: (password: string) => void;
  className?: string;
  maxSuggestions?: number;
}

export function AutofillSuggestions({
  entries,
  contextUrl,
  onSelect,
  onCopyPassword,
  className,
  maxSuggestions = 3,
}: AutofillSuggestionsProps) {
  const { isEnabled, getSuggestionsForUrl, recordSelection, extractDomain } = useVaultAI();
  
  // Get AI suggestions for current context
  const suggestions = useMemo(() => {
    if (!isEnabled || !contextUrl || entries.length === 0) {
      return [];
    }
    return getSuggestionsForUrl(entries, contextUrl, maxSuggestions);
  }, [isEnabled, contextUrl, entries, getSuggestionsForUrl, maxSuggestions]);
  
  if (!isEnabled || suggestions.length === 0) {
    return null;
  }
  
  const handleSelect = (entry: PasswordEntry) => {
    recordSelection(entry, contextUrl);
    onSelect(entry);
  };
  
  const handleCopyPassword = async (entry: PasswordEntry) => {
    recordSelection(entry, contextUrl);
    onCopyPassword(entry.password);
  };
  
  const domain = extractDomain(contextUrl || '');

  return (
    <Card className={cn("bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span>VaultAI Suggestions</span>
          {domain && (
            <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-gray-400">
              for {domain}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                  "hover:bg-primary/10 group",
                  index === 0 && "bg-primary/5"
                )}
                onClick={() => handleSelect(suggestion)}
              >
                {/* Icon */}
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  index === 0 ? "bg-primary/20" : "bg-[#252525]"
                )}>
                  {index === 0 ? (
                    <Zap className="h-4 w-4 text-primary" />
                  ) : (
                    <Globe className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200 truncate">
                      {suggestion.title}
                    </span>
                    {suggestion.is_favorite && (
                      <Star className="h-3 w-3 text-primary fill-primary flex-shrink-0" />
                    )}
                    {index === 0 && (
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">
                        Best Match
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {suggestion.username}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-primary/20 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPassword(suggestion);
                    }}
                    title="Copy password"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {suggestion.website && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-primary/20 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        let url = suggestion.website;
                        if (!url.startsWith('http')) url = 'https://' + url;
                        window.open(url, '_blank');
                      }}
                      title="Open website"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                
                <ChevronRight className="h-4 w-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {suggestions.length > 0 && (
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            Suggestions based on your usage patterns
          </p>
        )}
      </CardContent>
    </Card>
  );
}
