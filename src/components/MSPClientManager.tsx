import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Building2, Plus, Settings, TrendingUp } from 'lucide-react';
import { useSafeWebData } from '@/hooks/useSafeWebData';
import { toast } from 'sonner';

export const MSPClientManager = () => {
  const { mspClients, loading, addMspClient, fetchMspClients } = useSafeWebData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    domain: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    billing_email: '',
    subscription_plan: 'basic',
    monthly_price: '',
    max_assets: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.contact_name || !formData.contact_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const result = await addMspClient({
      ...formData,
      monthly_price: formData.monthly_price ? parseFloat(formData.monthly_price) : undefined,
      max_assets: formData.max_assets ? parseInt(formData.max_assets) : undefined,
    });

    if (result.success) {
      toast.success('MSP client created successfully');
      setIsDialogOpen(false);
      setFormData({
        company_name: '',
        domain: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        billing_email: '',
        subscription_plan: 'basic',
        monthly_price: '',
        max_assets: ''
      });
      await fetchMspClients();
    } else {
      toast.error('Failed to create MSP client');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'trial': return 'bg-blue-500 text-white';
      case 'suspended': return 'bg-orange-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
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
          <h2 className="text-2xl font-bold tracking-tight">MSP Client Management</h2>
          <p className="text-muted-foreground">Manage your managed service provider clients</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New MSP Client</DialogTitle>
              <DialogDescription>
                Create a new client account for your managed services
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    placeholder="Enter contact name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@company.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_email">Billing Email</Label>
                  <Input
                    id="billing_email"
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => handleInputChange('billing_email', e.target.value)}
                    placeholder="billing@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription_plan">Subscription Plan</Label>
                  <Select 
                    value={formData.subscription_plan} 
                    onValueChange={(value) => handleInputChange('subscription_plan', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic ($299/mo)</SelectItem>
                      <SelectItem value="professional">Professional ($599/mo)</SelectItem>
                      <SelectItem value="enterprise">Enterprise ($1299/mo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_price">Monthly Price ($)</Label>
                  <Input
                    id="monthly_price"
                    type="number"
                    step="0.01"
                    value={formData.monthly_price}
                    onChange={(e) => handleInputChange('monthly_price', e.target.value)}
                    placeholder="299.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_assets">Max Assets</Label>
                  <Input
                    id="max_assets"
                    type="number"
                    value={formData.max_assets}
                    onChange={(e) => handleInputChange('max_assets', e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Client</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mspClients.length}</div>
            <p className="text-xs text-muted-foreground">
              Active managed accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mspClients.reduce((sum, client) => sum + client.monthly_price, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {mspClients.reduce((sum, client) => sum + (client.threat_stats?.critical_threats || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Accounts</CardTitle>
          <CardDescription>Manage your MSP client accounts and their subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {mspClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Threats</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mspClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.company_name}</p>
                        {client.domain && (
                          <p className="text-sm text-muted-foreground">{client.domain}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.contact_name}</p>
                        <p className="text-sm text-muted-foreground">{client.contact_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanColor(client.subscription_plan)}>
                        {client.subscription_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(client.subscription_status)}>
                        {client.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      ${client.monthly_price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {client.threat_stats && (
                        <div className="flex gap-1">
                          {client.threat_stats.critical_threats > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {client.threat_stats.critical_threats} critical
                            </Badge>
                          )}
                          {client.threat_stats.total_threats > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {client.threat_stats.total_threats} total
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No MSP clients yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first managed service client
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};