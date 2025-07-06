import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Calendar, FileText, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BillingRecord {
  id: string;
  client_id: string;
  billing_period_start: string;
  billing_period_end: string;
  client_charge: number;
  ultrium_fee: number;
  msp_profit: number;
  asset_count: number;
  threat_count: number;
  status: string;
  created_at: string;
  client?: {
    company_name: string;
    subscription_plan: string;
  };
}

interface RevenueSummary {
  total_monthly_revenue: number;
  total_annual_revenue: number;
  total_clients: number;
  average_revenue_per_client: number;
  revenue_by_plan: {
    basic: number;
    professional: number;
    enterprise: number;
  };
  recent_invoices: BillingRecord[];
}

export const BillingDashboard = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  const fetchRevenueSummary = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('safeweb-billing', {
        method: 'GET',
        body: { action: 'revenue_summary' }
      });

      if (error) throw error;
      setRevenueSummary(data.summary);
    } catch (err) {
      console.error('Error fetching revenue summary:', err);
      toast.error('Failed to fetch revenue summary');
    }
  };

  const fetchBillingRecords = async (period?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('safeweb-billing', {
        method: 'GET',
        body: { period }
      });

      if (error) throw error;
      setBillingRecords(data.records || []);
    } catch (err) {
      console.error('Error fetching billing records:', err);
      toast.error('Failed to fetch billing records');
    }
  };

  const generateBilling = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('safeweb-billing', {
        method: 'POST',
        body: { 
          action: 'generate_billing',
          billing_period: selectedPeriod 
        }
      });

      if (error) throw error;
      
      toast.success(`Generated ${data.records?.length || 0} billing records`);
      await Promise.all([fetchBillingRecords(selectedPeriod), fetchRevenueSummary()]);
    } catch (err) {
      console.error('Error generating billing:', err);
      toast.error('Failed to generate billing records');
    } finally {
      setLoading(false);
    }
  };

  const updateBillingStatus = async (recordId: string, status: string) => {
    try {
      const { error } = await supabase.functions.invoke('safeweb-billing', {
        method: 'PUT',
        body: { 
          action: 'update_status',
          record_id: recordId,
          status
        }
      });

      if (error) throw error;
      
      toast.success(`Billing record marked as ${status}`);
      await fetchBillingRecords(selectedPeriod);
    } catch (err) {
      console.error('Error updating billing status:', err);
      toast.error('Failed to update billing status');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchRevenueSummary(),
        fetchBillingRecords(selectedPeriod)
      ]);
      setLoading(false);
    };

    loadData();
  }, [selectedPeriod]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'invoiced': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !revenueSummary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing & Revenue</h2>
          <p className="text-muted-foreground">Track your MSP revenue and billing cycles</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const period = date.toISOString().slice(0, 7);
                const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                return (
                  <SelectItem key={period} value={period}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button onClick={generateBilling} disabled={loading}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Billing
          </Button>
        </div>
      </div>

      {revenueSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueSummary.total_monthly_revenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Current month earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueSummary.total_annual_revenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total year-to-date
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue/Client</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueSummary.average_revenue_per_client.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per client monthly
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenueSummary.total_clients}</div>
              <p className="text-xs text-muted-foreground">
                Billing accounts
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <CardDescription>Monthly revenue breakdown by subscription tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueSummary && (
              <>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Basic</span>
                  </div>
                  <span className="font-mono">${revenueSummary.revenue_by_plan.basic.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Professional</span>
                  </div>
                  <span className="font-mono">${revenueSummary.revenue_by_plan.professional.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gold-500 rounded-full"></div>
                    <span className="font-medium">Enterprise</span>
                  </div>
                  <span className="font-mono">${revenueSummary.revenue_by_plan.enterprise.toFixed(2)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest billing records and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueSummary?.recent_invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.client?.company_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.billing_period_start).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">${invoice.msp_profit.toFixed(2)}</p>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing Records</CardTitle>
          <CardDescription>
            Detailed billing information for {new Date(selectedPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Client Charge</TableHead>
                  <TableHead>Ultrium Fee</TableHead>
                  <TableHead>Your Profit</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Threats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.client?.company_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {record.client?.subscription_plan}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(record.billing_period_start).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">
                          to {new Date(record.billing_period_end).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">${record.client_charge.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      ${record.ultrium_fee.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-green-600">
                      ${record.msp_profit.toFixed(2)}
                    </TableCell>
                    <TableCell>{record.asset_count}</TableCell>
                    <TableCell>{record.threat_count}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBillingStatus(record.id, 'invoiced')}
                        >
                          Mark Invoiced
                        </Button>
                      )}
                      {record.status === 'invoiced' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBillingStatus(record.id, 'paid')}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No billing records</h3>
              <p className="text-muted-foreground mb-4">
                Generate billing records for this period to start tracking revenue
              </p>
              <Button onClick={generateBilling} disabled={loading}>
                Generate Billing Records
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};