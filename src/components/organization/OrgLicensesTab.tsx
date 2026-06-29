import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Key, Shield, Brain, Monitor, UserPlus, UserMinus, Plus, Loader2, ExternalLink } from 'lucide-react';

const PRODUCT_META: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  safesuite: { label: 'Wrayth', icon: Shield, color: 'text-green-500' },
  ai_studio: { label: 'AI Studio', icon: Brain, color: 'text-purple-500' },
  vanguard: { label: 'Vanguard', icon: Monitor, color: 'text-blue-500' },
};

const PRICING: Record<string, Record<string, number>> = {
  safesuite: { pro: 9.99, business: 15, enterprise: 45 },
  ai_studio: { pro: 19.99, business: 39.99, enterprise: 79.99 },
  vanguard: { pro: 29.99, business: 59.99, enterprise: 99.99 },
};

export const OrgLicensesTab = () => {
  const { licenses, members, assignments, isAdmin, assignLicense, unassignLicense, organization, refetch } = useOrganization();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('safesuite');
  const [selectedLevel, setSelectedLevel] = useState<string>('pro');
  const [seatCount, setSeatCount] = useState(5);
  const [purchasing, setPurchasing] = useState(false);

  // Handle checkout success callback (one-time)
  const [checkoutHandled, setCheckoutHandled] = useState(false);
  const checkoutStatus = searchParams.get('checkout');
  if (checkoutStatus === 'success' && !checkoutHandled) {
    setCheckoutHandled(true);
    toast({ title: 'Payment successful!', description: 'Your license will be activated shortly.' });
    refetch();
  }

  const activeMembers = members.filter(m => m.status === 'active');

  const getAssignedMembers = (licenseId: string) =>
    assignments.filter(a => a.license_id === licenseId);

  const getUnassignedMembers = (licenseId: string) => {
    const assignedMemberIds = new Set(getAssignedMembers(licenseId).map(a => a.member_id));
    return activeMembers.filter(m => !assignedMemberIds.has(m.id));
  };

  const handlePurchase = async () => {
    if (!organization) return;
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('org-checkout', {
        body: {
          product: selectedProduct,
          accessLevel: selectedLevel,
          seats: seatCount,
          organizationId: organization.id,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        setPurchaseOpen(false);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to start checkout', variant: 'destructive' });
    } finally {
      setPurchasing(false);
    }
  };

  const pricePerSeat = PRICING[selectedProduct]?.[selectedLevel] || 0;

  return (
    <div className="space-y-6">
      {/* Add License button */}
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add License
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purchase Organization License</DialogTitle>
                <DialogDescription>
                  Choose a product, tier, and number of seats for your team.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safesuite">Wrayth</SelectItem>
                      <SelectItem value="ai_studio">AI Studio</SelectItem>
                      <SelectItem value="vanguard">Vanguard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Seats</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={seatCount}
                    onChange={(e) => setSeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price per seat</span>
                    <span className="font-medium">${pricePerSeat}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Seats</span>
                    <span className="font-medium">×{seatCount}</span>
                  </div>
                  <div className="border-t border-border pt-1 flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>${(pricePerSeat * seatCount).toFixed(2)}/mo</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPurchaseOpen(false)}>Cancel</Button>
                <Button onClick={handlePurchase} disabled={purchasing}>
                  {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                  Checkout with Stripe
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Empty state */}
      {licenses.length === 0 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Key className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No Licenses Yet</CardTitle>
            <CardDescription>
              Purchase product licenses to assign to your team members. Click "Add License" above to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* License cards */}
      {licenses.map((license) => {
        const meta = PRODUCT_META[license.product] || { label: license.product, icon: Key, color: 'text-foreground' };
        const Icon = meta.icon;
        const seatUsage = license.total_seats > 0 ? (license.used_seats / license.total_seats) * 100 : 0;
        const assignedMembers = getAssignedMembers(license.id);
        const unassignedMembers = getUnassignedMembers(license.id);

        return (
          <Card key={license.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                  {meta.label}
                  <Badge variant="outline" className="capitalize ml-2">{license.access_level}</Badge>
                </CardTitle>
                <div className="text-right">
                  <p className="text-sm font-medium">{license.used_seats} / {license.total_seats} seats</p>
                  <p className="text-xs text-muted-foreground capitalize">{license.billing_cycle}</p>
                </div>
              </div>
              <Progress value={seatUsage} className="h-2" />
              {license.expires_at && (
                <p className="text-xs text-muted-foreground">
                  Renews {new Date(license.expires_at).toLocaleDateString()}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {assignedMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Assigned Members</p>
                  {assignedMembers.map((assignment) => {
                    const member = members.find(m => m.id === assignment.member_id);
                    if (!member) return null;
                    return (
                      <div key={assignment.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/50">
                        <span className="text-sm">{member.email}</span>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => unassignLicense(assignment.id)}
                          >
                            <UserMinus className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isAdmin && license.used_seats < license.total_seats && unassignedMembers.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Select onValueChange={(memberId) => assignLicense(license.id, memberId)}>
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue placeholder="Assign a member…" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {license.used_seats >= license.total_seats && (
                <p className="text-xs font-medium text-destructive">All seats are assigned. Upgrade to add more.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
