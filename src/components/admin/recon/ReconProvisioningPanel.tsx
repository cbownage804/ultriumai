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
      // Activation credentials
      activation_key: unit.activation_key,
      serial_number: unit.serial_number,
      
      // API configuration
      api: {
        base_url: "https://nsyobmjpdpvesjwdphlh.supabase.co",
        functions_url: "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1",
        activate_endpoint: "/recon-activate",
        heartbeat_endpoint: "/vanguard-heartbeat",
        anon_key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI",
      },
      
      // Customer info (for display/logging only)
      customer: {
        id: order.user_id,
        name: order.customer_name,
        email: order.customer_email,
      },
      
      // Hardware & subscription details
      hardware_tier: unit.hardware_tier,
      subscription_tier: order.subscription_tier,
      
      // Agent behavior settings
      settings: {
        heartbeat_interval_seconds: 60,
        scan_interval_seconds: order.subscription_tier === 'essential' ? 86400 : 3600, // daily vs hourly
        log_level: "info",
        auto_update: true,
      },
      
      // Feature flags based on subscription
      features: {
        network_discovery: true,
        vulnerability_scanning: order.subscription_tier !== 'essential',
        traffic_analysis: order.subscription_tier === 'enterprise' || order.subscription_tier === 'professional',
        threat_detection: true,
        compliance_reporting: order.subscription_tier === 'enterprise',
      },
      
      // Provisioning metadata
      provisioned_at: new Date().toISOString(),
      config_version: "1.0.0",
    };
    return JSON.stringify(config, null, 2);
  };

  const generateBootstrapScript = () => {
    return `#!/bin/bash
# Vanguard Recon Unit Bootstrap Script
# This script runs on first boot to activate the unit

CONFIG_FILE="/opt/vanguard-recon/config.json"
LOG_FILE="/var/log/vanguard-recon.log"

echo "[$(date)] Starting Vanguard Recon activation..." >> $LOG_FILE

# Read config
ACTIVATION_KEY=$(jq -r '.activation_key' $CONFIG_FILE)
SERIAL=$(jq -r '.serial_number' $CONFIG_FILE)
API_URL=$(jq -r '.api.functions_url' $CONFIG_FILE)
ANON_KEY=$(jq -r '.api.anon_key' $CONFIG_FILE)

# Get device info
MAC_ADDRESS=$(cat /sys/class/net/eth0/address 2>/dev/null || cat /sys/class/net/wlan0/address)
HOSTNAME=$(hostname)
LOCAL_IP=$(hostname -I | awk '{print $1}')
FIRMWARE_VERSION=$(cat /opt/vanguard-recon/version 2>/dev/null || echo "1.0.0")

# Call activation endpoint
RESPONSE=$(curl -s -X POST "$API_URL/recon-activate" \\
  -H "Content-Type: application/json" \\
  -H "apikey: $ANON_KEY" \\
  -d '{
    "activation_key": "'$ACTIVATION_KEY'",
    "serial_number": "'$SERIAL'",
    "mac_address": "'$MAC_ADDRESS'",
    "hostname": "'$HOSTNAME'",
    "local_ip": "'$LOCAL_IP'",
    "firmware_version": "'$FIRMWARE_VERSION'"
  }')

# Parse response
SUCCESS=$(echo $RESPONSE | jq -r '.success')
AGENT_ID=$(echo $RESPONSE | jq -r '.agent_id')
AGENT_KEY=$(echo $RESPONSE | jq -r '.agent_key')

if [ "$SUCCESS" = "true" ]; then
  echo "[$(date)] Activation successful! Agent ID: $AGENT_ID" >> $LOG_FILE
  
  # Save agent credentials
  echo "{
    \\"agent_id\\": \\"$AGENT_ID\\",
    \\"agent_key\\": \\"$AGENT_KEY\\"
  }" > /opt/vanguard-recon/agent-credentials.json
  
  # Start the agent service
  systemctl enable vanguard-recon
  systemctl start vanguard-recon
else
  echo "[$(date)] Activation failed: $RESPONSE" >> $LOG_FILE
  exit 1
fi
`;
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

  const downloadFullBundle = (unit: ReconInventoryItem, order: ReconOrder) => {
    // Create a README with instructions
    const readme = `# Vanguard Recon Unit Configuration
Serial: ${unit.serial_number}
Customer: ${order.customer_name}

## Setup Instructions

1. Flash Raspberry Pi OS Lite to SD card
2. Copy these files to /opt/vanguard-recon/:
   - config.json
   - activate.sh
3. Make activate.sh executable: chmod +x /opt/vanguard-recon/activate.sh
4. Add to /etc/rc.local (before exit 0):
   /opt/vanguard-recon/activate.sh &
5. Insert SD card and power on the Pi
6. The unit will auto-activate and appear in the customer's dashboard

## Files Included
- config.json: Unit configuration and API credentials
- activate.sh: Bootstrap script for first-boot activation
- README.md: This file

## Support
Contact: support@ultriumai.com
`;

    // For now, just download config - in production you'd use JSZip for a bundle
    const config = generateConfigBundle(unit, order);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon-bundle-${unit.serial_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ 
      title: 'Config bundle downloaded',
      description: 'Copy config.json to /opt/vanguard-recon/ on the SD card',
    });
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
