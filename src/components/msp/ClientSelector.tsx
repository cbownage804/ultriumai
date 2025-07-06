import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMSP } from "@/hooks/useMSP";
import { Building2 } from "lucide-react";

interface ClientSelectorProps {
  value?: string;
  onValueChange: (clientId: string) => void;
  placeholder?: string;
  className?: string;
}

export const ClientSelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Select a client site...",
  className 
}: ClientSelectorProps) => {
  const { clients, isLoading } = useMSP();

  const activeClients = clients.filter(client => client.is_active);
  const selectedClient = activeClients.find(client => client.id === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedClient && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{selectedClient.company_name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="" disabled>
            Loading clients...
          </SelectItem>
        ) : activeClients.length === 0 ? (
          <SelectItem value="" disabled>
            No active clients found
          </SelectItem>
        ) : (
          activeClients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">{client.company_name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({client.current_users} users)
                  </span>
                </div>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};