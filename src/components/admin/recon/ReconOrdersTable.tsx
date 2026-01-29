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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Eye,
  Truck,
  Package,
  Loader2,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import { ReconOrder, useReconOrders } from '@/hooks/useReconOrders';
import { 
  ORDER_STATUSES, 
  RECON_HARDWARE_TIERS, 
  RECON_SUBSCRIPTION_TIERS,
  formatPrice 
} from '@/config/reconPricing';

interface ReconOrdersTableProps {
  orders: ReconOrder[];
  isLoading: boolean;
}

export function ReconOrdersTable({ orders, isLoading }: ReconOrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ReconOrder | null>(null);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  const { updateOrderStatus, addShippingInfo } = useReconOrders();

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleShipOrder = (order: ReconOrder) => {
    setSelectedOrder(order);
    setShippingDialogOpen(true);
  };

  const confirmShipping = async () => {
    if (!selectedOrder || !trackingNumber || !carrier) return;

    await addShippingInfo.mutateAsync({
      orderId: selectedOrder.id,
      trackingNumber,
      carrier,
    });

    setShippingDialogOpen(false);
    setSelectedOrder(null);
    setTrackingNumber('');
    setCarrier('');
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
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
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
            {Object.entries(ORDER_STATUSES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Hardware</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const statusConfig = ORDER_STATUSES[order.order_status as keyof typeof ORDER_STATUSES];
                const hardware = RECON_HARDWARE_TIERS[order.hardware_tier as keyof typeof RECON_HARDWARE_TIERS];
                const subscription = RECON_SUBSCRIPTION_TIERS[order.subscription_tier as keyof typeof RECON_SUBSCRIPTION_TIERS];
                const totalPrice = order.unit_price_cents + order.subscription_price_cents;

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{hardware?.name || order.hardware_tier}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{subscription?.name || order.subscription_tier}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(totalPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig?.color || ''}>
                        {statusConfig?.label || order.order_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.order_status === 'provisioning' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShipOrder(order)}
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            Ship
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder && !shippingDialogOpen} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Order ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Customer</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {selectedOrder.customer_email}
                    </p>
                    {selectedOrder.customer_phone && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.customer_phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Shipping Address</h4>
                  <div className="text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 mt-1" />
                      <span>
                        {selectedOrder.shipping_address.street}<br />
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}<br />
                        {selectedOrder.shipping_address.country}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Hardware</p>
                  <p className="font-medium">
                    {RECON_HARDWARE_TIERS[selectedOrder.hardware_tier as keyof typeof RECON_HARDWARE_TIERS]?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(selectedOrder.unit_price_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subscription</p>
                  <p className="font-medium">
                    {RECON_SUBSCRIPTION_TIERS[selectedOrder.subscription_tier as keyof typeof RECON_SUBSCRIPTION_TIERS]?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(selectedOrder.subscription_price_cents)}/mo
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedOrder.quantity} unit(s)</p>
                </div>
              </div>

              {/* Tracking Info */}
              {selectedOrder.tracking_number && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Shipping Info</h4>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Carrier:</span> {selectedOrder.shipping_carrier}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Tracking:</span> {selectedOrder.tracking_number}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shipping Dialog */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shipping Information</DialogTitle>
            <DialogDescription>
              Enter the shipping details for this order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Carrier</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USPS">USPS</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmShipping}
              disabled={!trackingNumber || !carrier || addShippingInfo.isPending}
            >
              {addShippingInfo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Truck className="h-4 w-4 mr-2" />
              )}
              Mark as Shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
