import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  Package,
  Cpu,
  Download,
  CheckCircle2,
  Loader2,
  FileJson,
  Copy,
  Check,
} from 'lucide-react';
import { ReconOrder } from '@/hooks/useReconOrders';
import { ReconInventoryItem, useReconInventory } from '@/hooks/useReconInventory';
import { 
  RECON_HARDWARE_TIERS, 
  RECON_SUBSCRIPTION_TIERS,
  formatPrice,
  ORDER_STATUSES,
} from '@/config/reconPricing';
import { useToast } from '@/hooks/use-toast';

interface ReconProvisioningPanelProps {
  orders: ReconOrder[];
  inventory: ReconInventoryItem[];
}

export function ReconProvisioningPanel({ orders, inventory }: ReconProvisioningPanelProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [copiedConfig, setCopiedConfig] = useState(false);

  const { assignToOrder, getAvailableUnits } = useReconInventory();
  const { toast } = useToast();

  // Filter orders that need provisioning (paid but not yet provisioned)
  const provisionableOrders = orders.filter(
    (o) => o.order_status === 'paid'
  );

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const availableUnits = getAvailableUnits(selectedOrder?.hardware_tier);
  const selectedUnit = inventory.find((i) => i.id === selectedUnitId);

  // Get provisioned units (assigned but not shipped)
  const provisionedOrders = orders.filter((o) => o.order_status === 'provisioning');
  const provisionedUnits = inventory.filter((i) => i.status === 'assigned');

  const handleAssign = async () => {
    if (!selectedOrderId || !selectedUnitId) {
      toast({
        title: 'Please select both an order and a unit',
        variant: 'destructive',
      });
      return;
    }

    await assignToOrder.mutateAsync({
      inventoryId: selectedUnitId,
      orderId: selectedOrderId,
    });

    setSelectedOrderId('');
    setSelectedUnitId('');
  };

  const generateConfigBundle = (unit: ReconInventoryItem, order: ReconOrder) => {
    const config = {
      activation_key: unit.activation_key,
      customer_id: order.user_id,
      order_id: order.id,
      serial_number: unit.serial_number,
      hardware_tier: unit.hardware_tier,
      subscription_tier: order.subscription_tier,
      api_endpoint: 'https://ultriumai.lovable.app/api/v1/vanguard',
      heartbeat_interval: 60,
      features: {
        network_discovery: true,
        vulnerability_scanning: order.subscription_tier !== 'essential',
        traffic_analysis: order.subscription_tier === 'enterprise',
        threat_detection: true,
      },
    };
    return JSON.stringify(config, null, 2);
  };

  const downloadConfig = (unit: ReconInventoryItem, order: ReconOrder) => {
    const config = generateConfigBundle(unit, order);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon-config-${unit.serial_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Config file downloaded' });
  };

  const copyConfig = (unit: ReconInventoryItem, order: ReconOrder) => {
    const config = generateConfigBundle(unit, order);
    navigator.clipboard.writeText(config);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
    toast({ title: 'Config copied to clipboard' });
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Assign Unit to Order */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-cyan-500" />
            Provision New Unit
          </CardTitle>
          <CardDescription>
            Assign an available unit to a paid order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {provisionableOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
              <p>No orders waiting for provisioning</p>
            </div>
          ) : (
            <>
              {/* Order Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Order</label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {provisionableOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        <div className="flex items-center gap-2">
                          <span>{order.customer_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {RECON_HARDWARE_TIERS[order.hardware_tier as keyof typeof RECON_HARDWARE_TIERS]?.name}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder && (
                <>
                  {/* Order Details */}
                  <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                    <p><span className="text-muted-foreground">Customer:</span> {selectedOrder.customer_name}</p>
                    <p><span className="text-muted-foreground">Hardware:</span> {RECON_HARDWARE_TIERS[selectedOrder.hardware_tier as keyof typeof RECON_HARDWARE_TIERS]?.name}</p>
                    <p><span className="text-muted-foreground">Subscription:</span> {RECON_SUBSCRIPTION_TIERS[selectedOrder.subscription_tier as keyof typeof RECON_SUBSCRIPTION_TIERS]?.name}</p>
                  </div>

                  {/* Unit Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Unit 
                      <span className="text-muted-foreground ml-2">
                        ({availableUnits.length} available)
                      </span>
                    </label>
                    {availableUnits.length === 0 ? (
                      <p className="text-sm text-destructive">
                        No {selectedOrder.hardware_tier} units available. Add units to inventory first.
                      </p>
                    ) : (
                      <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a unit..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              <div className="flex items-center gap-2">
                                <Cpu className="h-3 w-3" />
                                <span className="font-mono">{unit.serial_number}</span>
                                {unit.mac_address && (
                                  <span className="text-xs text-muted-foreground">
                                    ({unit.mac_address})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Assign Button */}
                  <Button 
                    className="w-full gap-2"
                    disabled={!selectedUnitId || assignToOrder.isPending}
                    onClick={handleAssign}
                  >
                    {assignToOrder.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Assign & Generate Activation Key
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Provisioned Units (Ready to Ship) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-purple-500" />
            Ready to Ship
          </CardTitle>
          <CardDescription>
            Units that have been provisioned and are ready for shipping
          </CardDescription>
        </CardHeader>
        <CardContent>
          {provisionedUnits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No units ready to ship</p>
            </div>
          ) : (
            <div className="space-y-3">
              {provisionedUnits.map((unit) => {
                const order = orders.find((o) => o.id === unit.assigned_order_id);
                if (!order) return null;

                return (
                  <div 
                    key={unit.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {unit.serial_number}
                        </p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        Provisioned
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs font-mono">
                      <span className="text-muted-foreground">Key:</span>
                      <span className="flex-1">{unit.activation_key}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(unit.activation_key || '');
                          toast({ title: 'Key copied' });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => copyConfig(unit, order)}
                      >
                        {copiedConfig ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy Config
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => downloadConfig(unit, order)}
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
