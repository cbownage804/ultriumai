import { useMemo } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Key, TrendingUp, DollarSign, UserCheck, UserX, Clock } from 'lucide-react';

const PRODUCT_LABELS: Record<string, string> = {
  safesuite: 'SafeSuite',
  ai_studio: 'AI Studio',
  vanguard: 'Vanguard',
};

export const OrgAnalyticsCards = () => {
  const { members, licenses, assignments } = useOrganization();

  const stats = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active').length;
    const pendingMembers = members.filter(m => m.status === 'pending').length;
    const suspendedMembers = members.filter(m => m.status === 'suspended').length;

    const totalSeats = licenses.reduce((sum, l) => sum + l.total_seats, 0);
    const usedSeats = licenses.reduce((sum, l) => sum + l.used_seats, 0);
    const seatUtilization = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;

    // Estimate monthly cost (price * seats)
    const PRICING: Record<string, Record<string, number>> = {
      safesuite: { pro: 9.99, business: 15, enterprise: 45 },
      ai_studio: { pro: 19.99, business: 39.99, enterprise: 79.99 },
      vanguard: { pro: 29.99, business: 59.99, enterprise: 99.99 },
    };

    const monthlyCost = licenses.reduce((sum, l) => {
      const price = PRICING[l.product]?.[l.access_level] || 0;
      const multiplier = l.billing_cycle === 'yearly' ? 0.8 : 1; // assume 20% yearly discount
      return sum + price * l.total_seats * multiplier;
    }, 0);

    // Licenses by product
    const licensesByProduct = licenses.reduce((acc, l) => {
      const key = `${PRODUCT_LABELS[l.product] || l.product} ${l.access_level}`;
      acc[key] = (acc[key] || 0) + l.total_seats;
      return acc;
    }, {} as Record<string, number>);

    // Unassigned seats per license
    const unassignedByLicense = licenses.map(l => ({
      label: `${PRODUCT_LABELS[l.product]} ${l.access_level}`,
      unassigned: l.total_seats - l.used_seats,
      total: l.total_seats,
    })).filter(l => l.unassigned > 0);

    return {
      activeMembers, pendingMembers, suspendedMembers,
      totalSeats, usedSeats, seatUtilization,
      monthlyCost, licensesByProduct, unassignedByLicense,
    };
  }, [members, licenses, assignments]);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeMembers}</p>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.seatUtilization}%</p>
                <p className="text-xs text-muted-foreground">Seat Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.usedSeats}/{stats.totalSeats}</p>
                <p className="text-xs text-muted-foreground">Seats Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.monthlyCost.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Est. Monthly Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Member Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Member Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-primary" />
                Active
              </div>
              <Badge variant="default">{stats.activeMembers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Pending
              </div>
              <Badge variant="secondary">{stats.pendingMembers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <UserX className="h-4 w-4 text-destructive" />
                Suspended
              </div>
              <Badge variant="destructive">{stats.suspendedMembers}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Unassigned Seats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unassigned Seats</CardTitle>
            <CardDescription>Licenses with available seats to assign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.unassignedByLicense.length === 0 ? (
              <p className="text-sm text-muted-foreground">All seats are assigned.</p>
            ) : (
              stats.unassignedByLicense.map((l, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{l.label}</span>
                  <Badge variant="outline">{l.unassigned} of {l.total} free</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
