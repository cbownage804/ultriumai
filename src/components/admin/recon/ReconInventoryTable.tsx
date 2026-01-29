import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Plus,
  Loader2,
  Copy,
  Check,
  Cpu,
} from 'lucide-react';
import { ReconInventoryItem, useReconInventory } from '@/hooks/useReconInventory';
import { 
  INVENTORY_STATUSES, 
  RECON_HARDWARE_TIERS,
} from '@/config/reconPricing';
import { useToast } from '@/hooks/use-toast';

interface ReconInventoryTableProps {
  inventory: ReconInventoryItem[];
  isLoading: boolean;
}

export function ReconInventoryTable({ inventory, isLoading }: ReconInventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form state
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [hardwareTier, setHardwareTier] = useState<string>('lite');
  const [firmwareVersion, setFirmwareVersion] = useState('');
  const [notes, setNotes] = useState('');

  const { addUnit } = useReconInventory();
  const { toast } = useToast();

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.mac_address?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (item.activation_key?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddUnit = async () => {
    if (!serialNumber) {
      toast({
        title: 'Serial number required',
        variant: 'destructive',
      });
      return;
    }

    await addUnit.mutateAsync({
      serialNumber,
      macAddress: macAddress || undefined,
      hardwareTier,
      firmwareVersion: firmwareVersion || undefined,
      notes: notes || undefined,
    });

    // Reset form
    setSerialNumber('');
    setMacAddress('');
    setHardwareTier('lite');
    setFirmwareVersion('');
    setNotes('');
    setAddDialogOpen(false);
  };

  const copyActivationKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({ title: 'Activation key copied' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(INVENTORY_STATUSES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Recon Unit</DialogTitle>
              <DialogDescription>
                Enter the details of the new unit to add to inventory.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Serial Number *</Label>
                <Input
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g., VGD-2024-001234"
                />
              </div>

              <div className="space-y-2">
                <Label>MAC Address</Label>
                <Input
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  placeholder="e.g., DC:A6:32:XX:XX:XX"
                />
              </div>

              <div className="space-y-2">
                <Label>Hardware Tier</Label>
                <Select value={hardwareTier} onValueChange={setHardwareTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lite">Recon Lite (Pi 4)</SelectItem>
                    <SelectItem value="pro">Recon Pro (Pi 5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Firmware Version</Label>
                <Input
                  value={firmwareVersion}
                  onChange={(e) => setFirmwareVersion(e.target.value)}
                  placeholder="e.g., 1.0.0"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this unit..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddUnit}
                disabled={!serialNumber || addUnit.isPending}
              >
                {addUnit.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add to Inventory
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial Number</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Activation Key</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No units found
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
                const statusConfig = INVENTORY_STATUSES[item.status as keyof typeof INVENTORY_STATUSES];
                const hardware = RECON_HARDWARE_TIERS[item.hardware_tier as keyof typeof RECON_HARDWARE_TIERS];

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-cyan-500" />
                        {item.serial_number}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.mac_address || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{hardware?.name || item.hardware_tier}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig?.color || ''}>
                        {statusConfig?.label || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.activation_key ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {item.activation_key}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyActivationKey(item.activation_key!)}
                          >
                            {copiedKey === item.activation_key ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
