/**
 * Comprehensive Add Customer Dialog
 * Multi-step form for complete customer onboarding
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, User, MapPin, Globe, Phone, Mail, Plus, Trash2, 
  DollarSign, Shield, FileText, Check, ChevronRight, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isHQ: boolean;
}

interface NewCustomerData {
  // Company Info
  companyName: string;
  industry: string;
  website: string;
  phone: string;
  fax: string;
  domains: string[];
  notes: string;
  
  // Billing
  monthlyRate: number;
  billingEmail: string;
  contractStart: string;
  sla: string;
  
  // Contacts
  contacts: Contact[];
  
  // Locations
  locations: Location[];
}

const initialData: NewCustomerData = {
  companyName: '',
  industry: '',
  website: '',
  phone: '',
  fax: '',
  domains: [''],
  notes: '',
  monthlyRate: 0,
  billingEmail: '',
  contractStart: new Date().toISOString().split('T')[0],
  sla: 'standard',
  contacts: [{
    id: '1',
    name: '',
    email: '',
    phone: '',
    role: '',
    isPrimary: true
  }],
  locations: [{
    id: '1',
    name: 'Headquarters',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isHQ: true
  }]
};

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 
  'Education', 'Legal', 'Real Estate', 'Non-Profit', 'Other'
];

const slaOptions = [
  { value: 'basic', label: 'Basic - 24hr Response' },
  { value: 'standard', label: 'Standard - 8hr Response' },
  { value: 'premium', label: 'Premium - 4hr Response' },
  { value: 'enterprise', label: 'Enterprise - 1hr Response' }
];

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated?: (customer: any) => void;
}

export function AddCustomerDialog({ open, onOpenChange, onCustomerCreated }: AddCustomerDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<NewCustomerData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: User },
    { id: 'locations', label: 'Sites/Locations', icon: MapPin },
    { id: 'billing', label: 'Billing & SLA', icon: DollarSign },
  ];

  const resetForm = () => {
    setData(initialData);
    setCurrentStep(0);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const addContact = () => {
    setData({
      ...data,
      contacts: [
        ...data.contacts,
        {
          id: String(Date.now()),
          name: '',
          email: '',
          phone: '',
          role: '',
          isPrimary: false
        }
      ]
    });
  };

  const removeContact = (id: string) => {
    if (data.contacts.length <= 1) return;
    const remaining = data.contacts.filter(c => c.id !== id);
    // Ensure at least one primary
    if (!remaining.some(c => c.isPrimary) && remaining.length > 0) {
      remaining[0].isPrimary = true;
    }
    setData({ ...data, contacts: remaining });
  };

  const updateContact = (id: string, field: keyof Contact, value: any) => {
    setData({
      ...data,
      contacts: data.contacts.map(c => {
        if (c.id === id) {
          if (field === 'isPrimary' && value === true) {
            return { ...c, isPrimary: true };
          }
          return { ...c, [field]: value };
        }
        if (field === 'isPrimary' && value === true) {
          return { ...c, isPrimary: false };
        }
        return c;
      })
    });
  };

  const addLocation = () => {
    setData({
      ...data,
      locations: [
        ...data.locations,
        {
          id: String(Date.now()),
          name: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'United States',
          isHQ: false
        }
      ]
    });
  };

  const removeLocation = (id: string) => {
    if (data.locations.length <= 1) return;
    const remaining = data.locations.filter(l => l.id !== id);
    if (!remaining.some(l => l.isHQ) && remaining.length > 0) {
      remaining[0].isHQ = true;
    }
    setData({ ...data, locations: remaining });
  };

  const updateLocation = (id: string, field: keyof Location, value: any) => {
    setData({
      ...data,
      locations: data.locations.map(l => {
        if (l.id === id) {
          if (field === 'isHQ' && value === true) {
            return { ...l, isHQ: true };
          }
          return { ...l, [field]: value };
        }
        if (field === 'isHQ' && value === true) {
          return { ...l, isHQ: false };
        }
        return l;
      })
    });
  };

  const addDomain = () => {
    setData({ ...data, domains: [...data.domains, ''] });
  };

  const updateDomain = (index: number, value: string) => {
    const newDomains = [...data.domains];
    newDomains[index] = value;
    setData({ ...data, domains: newDomains });
  };

  const removeDomain = (index: number) => {
    if (data.domains.length <= 1) return;
    setData({ ...data, domains: data.domains.filter((_, i) => i !== index) });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Company
        if (!data.companyName.trim()) {
          toast.error('Company name is required');
          return false;
        }
        return true;
      case 1: // Contacts
        const primaryContact = data.contacts.find(c => c.isPrimary);
        if (!primaryContact?.name || !primaryContact?.email) {
          toast.error('Primary contact name and email are required');
          return false;
        }
        return true;
      case 2: // Locations
        const hqLocation = data.locations.find(l => l.isHQ);
        if (!hqLocation?.address || !hqLocation?.city) {
          toast.error('Headquarters address and city are required');
          return false;
        }
        return true;
      case 3: // Billing
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      const primaryContact = data.contacts.find(c => c.isPrimary) || data.contacts[0];

      // Get current user for user_id fields
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // For demo: use a placeholder msp_id if not available
      // In production, this would come from the logged-in MSP context
      const mspId = userId || '00000000-0000-0000-0000-000000000000';

      // Create the customer in msp_clients
      const { data: newClient, error: clientError } = await supabase
        .from('msp_clients')
        .insert({
          company_name: data.companyName,
          contact_email: primaryContact.email || 'no-email@placeholder.com',
          contact_name: primaryContact.name || 'Primary Contact',
          phone: data.phone || null,
          domain: data.domains.filter(d => d).join(',') || null,
          monthly_rate: data.monthlyRate || 0,
          msp_id: mspId,
          is_active: true,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create contacts
      if (newClient && data.contacts.length > 0) {
        const contactsToInsert = data.contacts
          .filter(c => c.name && c.email)
          .map(c => ({
            client_id: newClient.id,
            contact_name: c.name,
            email: c.email,
            phone: c.phone || null,
            role: c.role || null,
            is_primary: c.isPrimary,
          }));

        if (contactsToInsert.length > 0) {
          await supabase.from('client_contacts').insert(contactsToInsert);
        }
      }

      // Create locations in office_locations (requires user_id)
      if (userId && data.locations.length > 0) {
        const locationsToInsert = data.locations
          .filter(l => l.address)
          .map(l => ({
            name: l.name || (l.isHQ ? 'Headquarters' : 'Office'),
            address: l.address,
            city: l.city,
            state: l.state,
            postal_code: l.postalCode,
            country: l.country,
            is_primary: l.isHQ,
            user_id: userId,
          }));

        if (locationsToInsert.length > 0) {
          await supabase.from('office_locations').insert(locationsToInsert);
        }
      }

      toast.success(`Customer "${data.companyName}" created successfully`);
      onCustomerCreated?.(newClient);
      handleClose();
    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast.error(error.message || 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            Add New Customer
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 py-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${index < currentStep 
                      ? 'bg-cyan-500 text-black' 
                      : index === currentStep 
                        ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400' 
                        : 'bg-slate-800 text-white/40'}
                  `}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 ${index === currentStep ? 'text-cyan-400' : 'text-white/40'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${index < currentStep ? 'bg-cyan-500' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        <Separator className="bg-cyan-500/20" />

        {/* Step Content */}
        <ScrollArea className="flex-1 pr-4">
          <div className="py-4 space-y-6">
            {/* Step 0: Company Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-white/80">Company Name *</Label>
                    <Input
                      value={data.companyName}
                      onChange={(e) => setData({ ...data, companyName: e.target.value })}
                      placeholder="Enter company name"
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white/80">Industry</Label>
                    <Select 
                      value={data.industry} 
                      onValueChange={(v) => setData({ ...data, industry: v })}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-cyan-500/20">
                        {industries.map(ind => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-white/80">Website</Label>
                    <Input
                      value={data.website}
                      onChange={(e) => setData({ ...data, website: e.target.value })}
                      placeholder="https://example.com"
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white/80">Main Phone</Label>
                    <Input
                      value={data.phone}
                      onChange={(e) => setData({ ...data, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white/80">Fax</Label>
                    <Input
                      value={data.fax}
                      onChange={(e) => setData({ ...data, fax: e.target.value })}
                      placeholder="(555) 123-4568"
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                </div>

                {/* Domains */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white/80">Email Domains</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={addDomain}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Domain
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {data.domains.map((domain, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={domain}
                          onChange={(e) => updateDomain(i, e.target.value)}
                          placeholder="company.com"
                          className="bg-black/40 border-cyan-500/20 text-white"
                        />
                        {data.domains.length > 1 && (
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeDomain(i)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-white/80">Notes</Label>
                  <Textarea
                    value={data.notes}
                    onChange={(e) => setData({ ...data, notes: e.target.value })}
                    placeholder="Additional notes about this customer..."
                    className="bg-black/40 border-cyan-500/20 text-white min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Contacts */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-sm">Add contacts for this customer. At least one primary contact is required.</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addContact}
                    className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Contact
                  </Button>
                </div>

                <div className="space-y-4">
                  {data.contacts.map((contact, index) => (
                    <Card key={contact.id} className="bg-black/20 border-cyan-500/20">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-cyan-400" />
                            <span className="text-white font-medium">Contact {index + 1}</span>
                            {contact.isPrimary && (
                              <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Primary</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!contact.isPrimary && (
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateContact(contact.id, 'isPrimary', true)}
                                className="text-white/60 hover:text-cyan-400"
                              >
                                Set as Primary
                              </Button>
                            )}
                            {data.contacts.length > 1 && (
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeContact(contact.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white/60 text-xs">Full Name *</Label>
                            <Input
                              value={contact.name}
                              onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                              placeholder="John Smith"
                              className="bg-black/40 border-cyan-500/20 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white/60 text-xs">Email *</Label>
                            <Input
                              type="email"
                              value={contact.email}
                              onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                              placeholder="john@company.com"
                              className="bg-black/40 border-cyan-500/20 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white/60 text-xs">Phone</Label>
                            <Input
                              value={contact.phone}
                              onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                              placeholder="(555) 123-4567"
                              className="bg-black/40 border-cyan-500/20 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white/60 text-xs">Role/Title</Label>
                            <Input
                              value={contact.role}
                              onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                              placeholder="IT Director"
                              className="bg-black/40 border-cyan-500/20 text-white"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Locations */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-sm">Add office locations/sites for this customer.</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addLocation}
                    className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Location
                  </Button>
                </div>

                <div className="space-y-4">
                  {data.locations.map((location, index) => (
                    <Card key={location.id} className="bg-black/20 border-cyan-500/20">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-cyan-400" />
                            <span className="text-white font-medium">
                              {location.name || `Location ${index + 1}`}
                            </span>
                            {location.isHQ && (
                              <Badge className="bg-amber-500/20 text-amber-400 text-xs">HQ</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!location.isHQ && (
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateLocation(location.id, 'isHQ', true)}
                                className="text-white/60 hover:text-amber-400"
                              >
                                Set as HQ
                              </Button>
                            )}
                            {data.locations.length > 1 && (
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeLocation(location.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white/60 text-xs">Site Name</Label>
                            <Input
                              value={location.name}
                              onChange={(e) => updateLocation(location.id, 'name', e.target.value)}
                              placeholder="Main Office"
                              className="bg-black/40 border-cyan-500/20 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white/60 text-xs">Country</Label>
                            <Select 
                              value={location.country} 
                              onValueChange={(v) => updateLocation(location.id, 'country', v)}
                            >
                              <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-cyan-500/20">
                                <SelectItem value="United States">United States</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                <SelectItem value="Australia">Australia</SelectItem>
                                <SelectItem value="Germany">Germany</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-white/60 text-xs">Street Address *</Label>
                            <Input
                              value={location.address}
                              onChange={(e) => updateLocation(location.id, 'address', e.target.value)}
                              placeholder="123 Business Ave, Suite 500"
                              className="bg-black/40 border-cyan-500/20 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white/60 text-xs">City *</Label>
                            <Input
                              value={location.city}
                              onChange={(e) => updateLocation(location.id, 'city', e.target.value)}
                              placeholder="San Francisco"
                              className="bg-black/40 border-cyan-500/20 text-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-white/60 text-xs">State</Label>
                              <Input
                                value={location.state}
                                onChange={(e) => updateLocation(location.id, 'state', e.target.value)}
                                placeholder="CA"
                                className="bg-black/40 border-cyan-500/20 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-white/60 text-xs">Postal Code</Label>
                              <Input
                                value={location.postalCode}
                                onChange={(e) => updateLocation(location.id, 'postalCode', e.target.value)}
                                placeholder="94105"
                                className="bg-black/40 border-cyan-500/20 text-white"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Billing & SLA */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">Monthly Rate ($)</Label>
                    <Input
                      type="number"
                      value={data.monthlyRate}
                      onChange={(e) => setData({ ...data, monthlyRate: parseFloat(e.target.value) || 0 })}
                      placeholder="2500"
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Billing Email</Label>
                    <Input
                      type="email"
                      value={data.billingEmail}
                      onChange={(e) => setData({ ...data, billingEmail: e.target.value })}
                      placeholder="billing@company.com"
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Contract Start Date</Label>
                    <Input
                      type="date"
                      value={data.contractStart}
                      onChange={(e) => setData({ ...data, contractStart: e.target.value })}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">SLA Tier</Label>
                    <Select 
                      value={data.sla} 
                      onValueChange={(v) => setData({ ...data, sla: v })}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-cyan-500/20">
                        {slaOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6">
                  <h3 className="text-white font-medium mb-4">Summary</h3>
                  <Card className="bg-black/20 border-cyan-500/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Company</span>
                        <span className="text-white">{data.companyName || '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Primary Contact</span>
                        <span className="text-white">
                          {data.contacts.find(c => c.isPrimary)?.name || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Locations</span>
                        <span className="text-white">{data.locations.length} site(s)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Monthly Rate</span>
                        <span className="text-emerald-400">${data.monthlyRate.toLocaleString()}/mo</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">SLA</span>
                        <span className="text-cyan-400">
                          {slaOptions.find(s => s.value === data.sla)?.label || '—'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator className="bg-cyan-500/20" />

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {currentStep > 0 && (
              <Button 
                type="button"
                variant="outline" 
                onClick={handleBack}
                className="border-cyan-500/20 text-white/80"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
              className="border-cyan-500/20 text-white/80"
            >
              Cancel
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button 
                type="button"
                onClick={handleNext}
                className="bg-cyan-500 hover:bg-cyan-600 text-black"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-cyan-500 hover:bg-cyan-600 text-black"
              >
                {isSubmitting ? 'Creating...' : 'Create Customer'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
