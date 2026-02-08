import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Package,
  Boxes,
  Truck,
  Settings,
  RefreshCw,
  Code,
  HardDrive,
} from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { ReconOrdersTable } from '@/components/admin/recon/ReconOrdersTable';
import { ReconInventoryTable } from '@/components/admin/recon/ReconInventoryTable';
import { ReconProvisioningPanel } from '@/components/admin/recon/ReconProvisioningPanel';
import { ReconAgentDownloads } from '@/components/admin/recon/ReconAgentDownloads';
import { ReconImageBuilder } from '@/components/vanguard/recon/ReconImageBuilder';
import { useReconOrders } from '@/hooks/useReconOrders';
import { useReconInventory } from '@/hooks/useReconInventory';

const ReconProvisioningPage = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminAccess();
  const [activeTab, setActiveTab] = useState('orders');
  
  const { orders, isLoading: ordersLoading } = useReconOrders();
  const { inventory, isLoading: inventoryLoading } = useReconInventory();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Calculate stats
  const pendingOrders = orders?.filter(o => o.order_status === 'pending' || o.order_status === 'paid').length || 0;
  const availableUnits = inventory?.filter(i => i.status === 'available').length || 0;
  const shippedUnits = inventory?.filter(i => i.status === 'shipped').length || 0;
  const activeUnits = inventory?.filter(i => i.status === 'active').length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-cyan-500" />
                  Recon Provisioning
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage Vanguard Recon Unit orders and inventory
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                {pendingOrders} Pending Orders
              </Badge>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                {availableUnits} Available Units
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Pending:</span>
              <span className="font-medium">{pendingOrders}</span>
            </div>
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium">{availableUnits}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-purple-500" />
              <span className="text-muted-foreground">Shipped:</span>
              <span className="font-medium">{shippedUnits}</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-cyan-500" />
              <span className="text-muted-foreground">Active:</span>
              <span className="font-medium">{activeUnits}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-background">
              <Package className="h-4 w-4" />
              Orders
              {pendingOrders > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-yellow-500/20 text-yellow-400">
                  {pendingOrders}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2 data-[state=active]:bg-background">
              <Boxes className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="provisioning" className="gap-2 data-[state=active]:bg-background">
              <Settings className="h-4 w-4" />
              Provisioning
            </TabsTrigger>
            <TabsTrigger value="agent" className="gap-2 data-[state=active]:bg-background">
              <Code className="h-4 w-4" />
              Agent Software
            </TabsTrigger>
            <TabsTrigger value="image-builder" className="gap-2 data-[state=active]:bg-background">
              <HardDrive className="h-4 w-4" />
              Image Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <ReconOrdersTable 
              orders={orders || []} 
              isLoading={ordersLoading} 
            />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <ReconInventoryTable 
              inventory={inventory || []} 
              isLoading={inventoryLoading} 
            />
          </TabsContent>

          <TabsContent value="provisioning" className="mt-6">
            <ReconProvisioningPanel 
              orders={orders || []} 
              inventory={inventory || []} 
            />
          </TabsContent>

          <TabsContent value="agent" className="mt-6">
            <ReconAgentDownloads />
          </TabsContent>

          <TabsContent value="image-builder" className="mt-6">
            <ReconImageBuilder mode="admin" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ReconProvisioningPage;
