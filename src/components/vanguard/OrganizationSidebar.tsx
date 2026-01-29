import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Plus, Search, ChevronRight, Monitor, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  company_name: string;
  is_active: boolean;
  device_count?: number;
  alert_count?: number;
}

interface OrganizationSidebarProps {
  organizations: Organization[];
  selectedOrgId: string | null;
  onSelectOrg: (orgId: string | null) => void;
  onAddOrg: () => void;
  isLoading?: boolean;
}

export const OrganizationSidebar = ({
  organizations,
  selectedOrgId,
  onSelectOrg,
  onAddOrg,
  isLoading
}: OrganizationSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrgs = organizations.filter(org =>
    org.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeOrgs = filteredOrgs.filter(org => org.is_active);
  const inactiveOrgs = filteredOrgs.filter(org => !org.is_active);

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organizations
          </h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddOrg}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Organization List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Organizations option */}
          <button
            onClick={() => onSelectOrg(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mb-1",
              selectedOrgId === null
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="flex-1 text-left">All Organizations</span>
            <Badge variant="secondary" className="text-xs">
              {organizations.length}
            </Badge>
          </button>

          {/* Divider */}
          <div className="border-t my-2" />

          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                {searchQuery ? 'No organizations found' : 'No organizations yet'}
              </p>
              {!searchQuery && (
                <Button variant="outline" size="sm" onClick={onAddOrg}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Organization
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {activeOrgs.map(org => (
                <OrganizationItem
                  key={org.id}
                  org={org}
                  isSelected={selectedOrgId === org.id}
                  onClick={() => onSelectOrg(org.id)}
                />
              ))}
              
              {inactiveOrgs.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs text-muted-foreground font-medium">
                    Inactive
                  </div>
                  {inactiveOrgs.map(org => (
                    <OrganizationItem
                      key={org.id}
                      org={org}
                      isSelected={selectedOrgId === org.id}
                      onClick={() => onSelectOrg(org.id)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const OrganizationItem = ({
  org,
  isSelected,
  onClick
}: {
  org: Organization;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
      isSelected
        ? "bg-primary text-primary-foreground"
        : "hover:bg-muted"
    )}
  >
    <div className="flex-1 text-left">
      <p className="font-medium truncate">{org.company_name}</p>
      <div className="flex items-center gap-2 text-xs opacity-70">
        {org.device_count !== undefined && (
          <span className="flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            {org.device_count}
          </span>
        )}
        {(org.alert_count ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {org.alert_count}
          </span>
        )}
      </div>
    </div>
    <ChevronRight className={cn("h-4 w-4 opacity-50", isSelected && "opacity-100")} />
  </button>
);
