import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Phone, MapPin, Mail, Plus, Edit, Monitor } from "lucide-react";

interface Customer {
  id: string;
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes?: string;
  device_count: number;
  last_activity: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomerFormData {
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string;
}

// Mock data for demo
const mockCustomers: Customer[] = [
  {
    id: "1",
    company_name: "Acme Corporation",
    primary_contact_name: "John Smith",
    primary_contact_email: "john@acmecorp.com",
    phone: "(555) 123-4567",
    address: "123 Business St",
    city: "Business City",
    state: "NY",
    zip_code: "12345",
    notes: "Large enterprise client with 50+ workstations",
    device_count: 52,
    last_activity: "2024-01-06T10:30:00Z",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-06T10:30:00Z"
  },
  {
    id: "2",
    company_name: "TechStart LLC",
    primary_contact_name: "Sarah Wilson",
    primary_contact_email: "sarah@techstart.com",
    phone: "(555) 987-6543",
    address: "456 Tech Ave",
    city: "Innovation City",
    state: "CA",
    zip_code: "94102",
    notes: "Fast-growing startup, expanding rapidly",
    device_count: 15,
    last_activity: "2024-01-05T14:22:00Z",
    is_active: true,
    created_at: "2023-12-15T00:00:00Z",
    updated_at: "2024-01-05T14:22:00Z"
  }
];

export const CustomerManager = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [loading, setLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    company_name: '',
    primary_contact_name: '',
    primary_contact_email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: ''
  });
  
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCustomer) {
      // Update existing customer
      setCustomers(prev => prev.map(customer => 
        customer.id === editingCustomer.id 
          ? { ...customer, ...formData, updated_at: new Date().toISOString() }
          : customer
      ));
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    } else {
      // Add new customer
      const newCustomer: Customer = {
        ...formData,
        id: Date.now().toString(),
        device_count: 0,
        last_activity: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setCustomers(prev => [...prev, newCustomer]);
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
    }

    setShowAddDialog(false);
    setEditingCustomer(null);
    setFormData({
      company_name: '',
      primary_contact_name: '',
      primary_contact_email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: ''
    });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      company_name: customer.company_name,
      primary_contact_name: customer.primary_contact_name,
      primary_contact_email: customer.primary_contact_email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip_code: customer.zip_code,
      notes: customer.notes || ''
    });
    setShowAddDialog(true);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({
      company_name: '',
      primary_contact_name: '',
      primary_contact_email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: ''
    });
    setShowAddDialog(true);
  };

  const syncWithTicketing = (customerId: string) => {
    toast({
      title: "Success",
      description: "Customer synced with ticketing system",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Customer Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage customers and sync with RMM devices and ticketing system
              </p>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last activity: {new Date(customer.last_activity).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.primary_contact_name}</p>
                        <p className="text-sm text-muted-foreground">{customer.primary_contact_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {customer.primary_contact_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1 text-sm">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        <div>
                          <p>{customer.address}</p>
                          <p>{customer.city}, {customer.state} {customer.zip_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-4 w-4" />
                        <span className="font-medium">{customer.device_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.is_active ? "default" : "secondary"}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncWithTicketing(customer.id)}
                        >
                          Sync
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update customer information' : 'Add a new customer to the system'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="primary_contact_name">Primary Contact *</Label>
                <Input
                  id="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_contact_email">Email *</Label>
                <Input
                  id="primary_contact_email"
                  type="email"
                  value={formData.primary_contact_email}
                  onChange={(e) => setFormData({...formData, primary_contact_email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zip_code">ZIP Code *</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes about this customer..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};