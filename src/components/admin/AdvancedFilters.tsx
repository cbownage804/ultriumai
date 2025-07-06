import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X, Search } from 'lucide-react';
import { format } from 'date-fns';

export interface FilterCriteria {
  search: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  status?: string;
  accountType?: string;
  subscriptionTier?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  hasActivity?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterCriteria) => void;
  entityType: 'users' | 'msps' | 'gpts' | 'subscriptions';
  currentFilters: FilterCriteria;
}

export const AdvancedFilters = ({ onFiltersChange, entityType, currentFilters }: AdvancedFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterCriteria>(currentFilters);

  const handleFilterChange = (key: keyof FilterCriteria, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterCriteria = {
      search: '',
      dateRange: {},
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.dateRange.from || localFilters.dateRange.to) count++;
    if (localFilters.status) count++;
    if (localFilters.accountType) count++;
    if (localFilters.subscriptionTier) count++;
    if (localFilters.hasActivity !== undefined) count++;
    return count;
  };

  const getStatusOptions = () => {
    switch (entityType) {
      case 'users':
        return [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending Verification' }
        ];
      case 'msps':
        return [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'trial', label: 'Trial' }
        ];
      case 'gpts':
        return [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'public', label: 'Public' },
          { value: 'private', label: 'Private' }
        ];
      case 'subscriptions':
        return [
          { value: 'active', label: 'Active' },
          { value: 'canceled', label: 'Canceled' },
          { value: 'past_due', label: 'Past Due' }
        ];
      default:
        return [];
    }
  };

  const getSortOptions = () => {
    const common = [
      { value: 'created_at', label: 'Date Created' },
      { value: 'updated_at', label: 'Last Updated' }
    ];

    switch (entityType) {
      case 'users':
        return [
          ...common,
          { value: 'email', label: 'Email' },
          { value: 'full_name', label: 'Name' },
          { value: 'last_login', label: 'Last Login' }
        ];
      case 'msps':
        return [
          ...common,
          { value: 'company_name', label: 'Company Name' },
          { value: 'subscription_tier', label: 'Tier' },
          { value: 'trial_ends_at', label: 'Trial End' }
        ];
      case 'gpts':
        return [
          ...common,
          { value: 'name', label: 'Name' },
          { value: 'chat_count', label: 'Usage' },
          { value: 'sharing_level', label: 'Sharing Level' }
        ];
      case 'subscriptions':
        return [
          ...common,
          { value: 'subscription_tier', label: 'Tier' },
          { value: 'subscription_end', label: 'End Date' }
        ];
      default:
        return common;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary">{getActiveFilterCount()}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Filter and search {entityType} with advanced criteria
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            {getActiveFilterCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Always visible basic search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${entityType}...`}
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {isExpanded && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateRange.from ? format(localFilters.dateRange.from, 'MMM dd') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange.from}
                      onSelect={(date) => 
                        handleFilterChange('dateRange', { ...localFilters.dateRange, from: date })
                      }
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateRange.to ? format(localFilters.dateRange.to, 'MMM dd') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange.to}
                      onSelect={(date) => 
                        handleFilterChange('dateRange', { ...localFilters.dateRange, to: date })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={localFilters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {getStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Type (for users) */}
            {entityType === 'users' && (
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select
                  value={localFilters.accountType || ''}
                  onValueChange={(value) => handleFilterChange('accountType', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="msp">MSP</SelectItem>
                    <SelectItem value="mssp">MSSP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subscription Tier */}
            {(entityType === 'users' || entityType === 'msps' || entityType === 'subscriptions') && (
              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Select
                  value={localFilters.subscriptionTier || ''}
                  onValueChange={(value) => handleFilterChange('subscriptionTier', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All tiers</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sort Options */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <div className="flex gap-2">
                <Select
                  value={localFilters.sortBy || 'created_at'}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getSortOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={localFilters.sortOrder || 'desc'}
                  onValueChange={(value) => handleFilterChange('sortOrder', value as 'asc' | 'desc')}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">↓</SelectItem>
                    <SelectItem value="asc">↑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};