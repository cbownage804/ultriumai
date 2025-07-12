import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Settings,
  BarChart3,
  Globe,
  Code,
  Shield,
  Crown,
  Zap,
  Target,
  Copy,
  Eye,
  ExternalLink,
  FileText,
  Activity,
  Clock,
  ArrowLeft,
  Home,
  XCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Package,
  HeadphonesIcon
} from 'lucide-react';
import { useMSP, MSPClient } from '@/hooks/useMSP';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SafeDocScanner from '@/components/SafeDocScanner';
import { MSPRevenueOptimizer } from '@/components/MSPRevenueOptimizer';
import { MSPClientRiskScorecard } from '@/components/MSPClientRiskScorecard';
import { MSPROICalculator } from '@/components/MSPROICalculator';
import { MSPExecutiveBriefing } from '@/components/MSPExecutiveBriefing';
import { MSPProfitAnalytics } from '@/components/MSPProfitAnalytics';
import { MSPUpsellingEngine } from '@/components/MSPUpsellingEngine';
import { MSPChurnPrediction } from '@/components/MSPChurnPrediction';
import { MSPCompetitiveBenchmarks } from '@/components/MSPCompetitiveBenchmarks';
import { MSPLeadScoring } from '@/components/MSPLeadScoring';
import { HelpdeskDashboard } from '@/components/dashboards/HelpdeskDashboard';
import { UltriumGPTAssistant } from '@/components/UltriumGPTAssistant';
import { SecurityDashboard } from '@/components/dashboards/SecurityDashboard';
import { BusinessIntelligence } from '@/components/dashboards/BusinessIntelligence';
import { ClientPortal } from '@/components/client/ClientPortal';
import { AnnouncementManager } from '@/components/announcements/AnnouncementManager';

const MSPControlCenter = () => {
  const { 
    msp, 
    clients, 
    isLoading, 
    createMSP, 
    createClient, 
    generateEmbedCode,
    calculateMetrics 
  } = useMSP();
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  
  const [showCreateMSP, setShowCreateMSP] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState<MSPClient | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [mspForm, setMspForm] = useState({
    company_name: '',
    domain: '',
    contact_email: '',
    phone: '',
    brand_name: 'SafePass',
    brand_color: '#3b82f6'
  });
  
  const [clientForm, setClientForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    domain: '',
    phone: '',
    max_users: 5,
    monthly_rate: 15,
    business_size: 'small' as 'small' | 'medium' | 'enterprise',
    onboarding_fee_amount: 500
  });

  // Determine business size based on user count
  const getBusinessSizeFromUserCount = (userCount: number): 'small' | 'medium' | 'enterprise' => {
    if (userCount <= 25) return 'small';
    if (userCount <= 99) return 'medium';
    return 'enterprise';
  };

  // Calculate onboarding fee based on business size
  const calculateOnboardingFee = (businessSize: string) => {
    switch (businessSize) {
      case 'small':
        return 500;
      case 'medium':
        return 1500;
      case 'enterprise':
        return 2500;
      default:
        return 500;
    }
  };

  // Handle user count change and automatically update business size
  const handleUserCountChange = (userCount: number) => {
    const businessSize = getBusinessSizeFromUserCount(userCount);
    const onboardingFee = calculateOnboardingFee(businessSize);
    
    setClientForm(prev => ({ 
      ...prev, 
      max_users: userCount,
      business_size: businessSize,
      onboarding_fee_amount: onboardingFee
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !msp) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('msp-logos')
        .upload(fileName, file, { 
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('msp-logos')
        .getPublicUrl(fileName);

      // Update MSP record with logo URL
      const { error: updateError } = await supabase
        .from('msps')
        .update({ logo_url: publicUrl })
        .eq('id', msp.id);

      if (updateError) throw updateError;

      toast({
        title: "Logo uploaded successfully",
        description: "Your MSP logo has been updated",
      });

      // Refresh the page to show the new logo
      window.location.reload();

    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!user || !msp) return;

    try {
      // Remove from storage
      if (msp.logo_url) {
        const fileName = `${user.id}/logo.${msp.logo_url.split('.').pop()}`;
        await supabase.storage
          .from('msp-logos')
          .remove([fileName]);
      }

      // Update MSP record
      const { error } = await supabase
        .from('msps')
        .update({ logo_url: null })
        .eq('id', msp.id);

      if (error) throw error;

      toast({
        title: "Logo removed",
        description: "Your MSP logo has been removed",
      });

      // Refresh the page
      window.location.reload();

    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: "Remove failed",
        description: "There was an error removing your logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateMSP = async () => {
    const result = await createMSP(mspForm);
    if (result) {
      setShowCreateMSP(false);
      setMspForm({
        company_name: '',
        domain: '',
        contact_email: '',
        phone: '',
        brand_name: 'SafePass',
        brand_color: '#3b82f6'
      });
    }
  };

  const handleCreateClient = async () => {
    const result = await createClient(clientForm);
    if (result) {
      setShowCreateClient(false);
      setClientForm({
        company_name: '',
        contact_name: '',
        contact_email: '',
        domain: '',
        phone: '',
        max_users: 5,
        monthly_rate: 15,
        business_size: 'small',
        onboarding_fee_amount: 500
      });
    }
  };

  const copyEmbedCode = (client: MSPClient) => {
    const code = generateEmbedCode(client);
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // MSP Setup Flow
  if (!msp) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <Crown className="h-16 w-16 mx-auto text-primary" />
            <h1 className="text-4xl font-bold">Welcome to MSP Control Center</h1>
            <p className="text-xl text-muted-foreground">
              Manage all your security services and generate recurring revenue
            </p>
          </div>

          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Set Up Your MSP Profile
              </CardTitle>
              <CardDescription>
                Create your MSP profile to start managing clients and generating revenue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={mspForm.company_name}
                    onChange={(e) => setMspForm(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Acme IT Solutions"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain Prefix</Label>
                  <Input
                    id="domain"
                    value={mspForm.domain}
                    onChange={(e) => setMspForm(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="acme"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your subdomain: {mspForm.domain || 'acme'}.safepass.com
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={mspForm.contact_email}
                    onChange={(e) => setMspForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="admin@acmeit.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={mspForm.phone}
                    onChange={(e) => setMspForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input
                    id="brand_name"
                    value={mspForm.brand_name}
                    onChange={(e) => setMspForm(prev => ({ ...prev, brand_name: e.target.value }))}
                    placeholder="SafePass"
                  />
                </div>
                <div>
                  <Label htmlFor="brand_color">Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brand_color"
                      type="color"
                      value={mspForm.brand_color}
                      onChange={(e) => setMspForm(prev => ({ ...prev, brand_color: e.target.value }))}
                      className="w-16"
                    />
                    <Input
                      value={mspForm.brand_color}
                      onChange={(e) => setMspForm(prev => ({ ...prev, brand_color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateMSP} 
                className="w-full"
                disabled={!mspForm.company_name || !mspForm.domain || !mspForm.contact_email}
              >
                <Crown className="h-4 w-4 mr-2" />
                Create MSP Profile
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleNavigation('/')} 
                className="w-full mt-3"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      {/* Navigation Header */}
      <div className="bg-muted/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center gap-3">
              {msp.logo_url ? (
                <img 
                  src={msp.logo_url} 
                  alt={`${msp.company_name} logo`}
                  className="h-10 w-10 rounded-lg object-cover border border-border"
                />
              ) : (
                <Crown className="h-10 w-10 text-primary" />
              )}
              {msp.company_name.replace(/\s*LLC\s*$/i, '')}
            </h1>
            <p className="text-xl text-muted-foreground">
              MSP Control Center • {metrics.totalClients} clients • ${metrics.monthlyRevenue.toFixed(0)} MRR
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                <Activity className="h-3 w-3 mr-1" />
                {metrics.activeClients} Active
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Users className="h-3 w-3 mr-1" />
                {metrics.totalUsers} Users
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-card/50 hover:bg-card">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    MSP Profile Settings
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_company_name">Company Name</Label>
                      <Input
                        id="edit_company_name"
                        defaultValue={msp.company_name}
                        placeholder="Your Company Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_domain">Domain Prefix</Label>
                      <Input
                        id="edit_domain"
                        defaultValue={msp.domain}
                        placeholder="yourcompany"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_contact_email">Contact Email</Label>
                      <Input
                        id="edit_contact_email"
                        type="email"
                        defaultValue={msp.contact_email}
                        placeholder="admin@yourcompany.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_phone">Phone</Label>
                      <Input
                        id="edit_phone"
                        defaultValue={msp.phone}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_brand_name">Brand Name</Label>
                      <Input
                        id="edit_brand_name"
                        defaultValue={msp.brand_name}
                        placeholder="Ultrium"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_brand_color">Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="edit_brand_color"
                          type="color"
                          defaultValue={msp.brand_color}
                          className="w-16"
                        />
                        <Input
                          defaultValue={msp.brand_color}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="pt-4 border-t">
                    <Label className="text-base font-medium">Company Logo</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload your company logo to replace the crown icon (max 5MB)
                    </p>
                    
                    {msp.logo_url ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                          <img 
                            src={msp.logo_url} 
                            alt="Current logo"
                            className="h-12 w-12 rounded-lg object-cover border border-border"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Current Logo</p>
                            <p className="text-xs text-muted-foreground">Click below to update or remove</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="flex-1"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingLogo ? 'Uploading...' : 'Update Logo'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRemoveLogo}
                            className="px-6"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No logo uploaded</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex gap-3">
                      <Button className="flex-1">
                        Save Changes
                      </Button>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          Cancel
                        </Button>
                      </DialogTrigger>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => handleNavigation('/msp-security-dashboard')}>
              <Shield className="h-4 w-4 mr-2" />
              Security Center
            </Button>
            <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Add New Client
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client_company">Company Name</Label>
                      <Input
                        id="client_company"
                        value={clientForm.company_name}
                        onChange={(e) => setClientForm(prev => ({ ...prev, company_name: e.target.value }))}
                        placeholder="ABC Corporation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_domain">Website Domain</Label>
                      <Input
                        id="client_domain"
                        value={clientForm.domain}
                        onChange={(e) => setClientForm(prev => ({ ...prev, domain: e.target.value }))}
                        placeholder="abccorp.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_name">Contact Name</Label>
                      <Input
                        id="contact_name"
                        value={clientForm.contact_name}
                        onChange={(e) => setClientForm(prev => ({ ...prev, contact_name: e.target.value }))}
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_email">Contact Email</Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={clientForm.contact_email}
                        onChange={(e) => setClientForm(prev => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="john@abccorp.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="max_users">User Seats</Label>
                      <Input
                        id="max_users"
                        type="number"
                        value={clientForm.max_users}
                        onChange={(e) => handleUserCountChange(parseInt(e.target.value) || 1)}
                        min="1"
                        placeholder="5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Determines business size and fee
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="monthly_rate">Rate per User</Label>
                      <Input
                        id="monthly_rate"
                        type="number"
                        step="0.01"
                        value={clientForm.monthly_rate}
                        onChange={(e) => setClientForm(prev => ({ ...prev, monthly_rate: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_phone">Phone</Label>
                      <Input
                        id="client_phone"
                        value={clientForm.phone}
                        onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 987-6543"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business_size">Business Size</Label>
                      <Input
                        id="business_size"
                        value={
                          clientForm.business_size === 'small' ? 'Small Business (1-25 users)' :
                          clientForm.business_size === 'medium' ? 'Medium Business (26-99 users)' :
                          'Enterprise (100+ users)'
                        }
                        readOnly
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically determined by user count
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="onboarding_fee">Onboarding Fee</Label>
                      <Input
                        id="onboarding_fee"
                        type="number"
                        value={clientForm.onboarding_fee_amount}
                        readOnly
                        className="bg-muted"
                        placeholder="Calculated automatically"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Fee based on business size
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateClient} 
                    className="w-full"
                    disabled={!clientForm.company_name || !clientForm.contact_name || !clientForm.contact_email}
                  >
                    Add Client
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Security Center</h3>
                  <p className="text-sm text-muted-foreground">Monitor client security</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4" onClick={() => handleNavigation('/msp-security-dashboard')}>
                Open Security Center
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">SafeTrack</h3>
                  <p className="text-sm text-muted-foreground">IT asset management</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4" onClick={() => handleNavigation('/safetrack')}>
                Launch SafeTrack
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Analytics</h3>
                  <p className="text-sm text-muted-foreground">View detailed reports</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4">
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{metrics.totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-success">{metrics.activeClients}</span> active
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{metrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all clients
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">${metrics.monthlyRevenue.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Client payments
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground">Your Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-success">${metrics.monthlyProfit.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((msp.commission_rate || 0.6667) * 100).toFixed(1)}% commission
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="clients" className="space-y-4">
          <div className="space-y-4">
            {/* Primary Navigation */}
            <TabsList className="grid grid-cols-5 lg:grid-cols-8 gap-1 h-auto p-1 bg-muted/30">
              <TabsTrigger value="clients" className="h-10">Clients</TabsTrigger>
              <TabsTrigger value="revenue" className="h-10">Revenue Optimizer</TabsTrigger>
              <TabsTrigger value="scorecards" className="h-10">Risk Scorecards</TabsTrigger>
              <TabsTrigger value="roi" className="h-10">ROI Calculator</TabsTrigger>
              <TabsTrigger value="reports" className="h-10">Executive Reports</TabsTrigger>
              <TabsTrigger value="profit-analytics" className="h-10">Profit Analytics</TabsTrigger>
              <TabsTrigger value="upselling" className="h-10">Upselling Engine</TabsTrigger>
              <TabsTrigger value="churn" className="h-10">Churn Prevention</TabsTrigger>
            </TabsList>
            
            {/* Secondary Navigation */}
            <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1 bg-muted/20">
              <TabsTrigger value="benchmarks" className="h-10">Benchmarks</TabsTrigger>
              <TabsTrigger value="leads" className="h-10">Lead Scoring</TabsTrigger>
              <TabsTrigger value="analytics" className="h-10">Analytics</TabsTrigger>
              <TabsTrigger value="security" className="h-10">Security Center</TabsTrigger>
              <TabsTrigger value="business-intel" className="h-10">Business Intelligence</TabsTrigger>
              <TabsTrigger value="client-portal" className="h-10">Client Portal</TabsTrigger>
              <TabsTrigger value="announcements" className="h-10">Announcements</TabsTrigger>
            </TabsList>
            
            {/* Apps Navigation */}
            <TabsList className="grid grid-cols-3 lg:grid-cols-3 gap-1 h-auto p-1 bg-muted/10">
              <TabsTrigger value="safedesk" className="h-10 flex items-center gap-2">
                <HeadphonesIcon className="h-4 w-4" />
                SafeDesk
              </TabsTrigger>
              <TabsTrigger value="ultriumgpt" className="h-10 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                UltriumGPT
              </TabsTrigger>
              <TabsTrigger value="safescan" className="h-10">SafeScan</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="clients" className="space-y-6">
            <div className="grid gap-6">
              {clients.length === 0 ? (
                <Card className="border-dashed border-2 border-muted">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Add your first client to start managing their security services
                    </p>
                    <Button onClick={() => setShowCreateClient(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Client
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                clients.map((client) => (
                  <Card key={client.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            {client.company_name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{client.contact_name}</span>
                            <span>•</span>
                            <span>{client.contact_email}</span>
                            {client.domain && (
                              <>
                                <span>•</span>
                                <span className="text-primary">{client.domain}</span>
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={client.billing_status === 'active' ? 'default' : 'secondary'} 
                                 className={client.billing_status === 'active' ? 'bg-success/10 text-success border-success/30' : ''}>
                            {client.billing_status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyEmbedCode(client)}
                            className="bg-card/50 hover:bg-card"
                          >
                            <Code className="h-4 w-4 mr-2" />
                            Embed Code
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <div className="text-muted-foreground text-sm">Users</div>
                          <div className="font-semibold text-lg">{client.current_users}/{client.max_users}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <div className="text-muted-foreground text-sm">Rate per User</div>
                          <div className="font-semibold text-lg">${client.monthly_rate}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-success/10">
                          <div className="text-muted-foreground text-sm">Monthly Revenue</div>
                          <div className="font-semibold text-lg text-success">
                            ${(client.current_users * client.monthly_rate).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <div className="text-muted-foreground text-sm">Domain</div>
                          <div className="font-semibold text-lg">{client.domain || 'Not set'}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Open configuration dialog/modal for this client
                            toast({
                              title: "Configuration",
                              description: `Configuration for ${client.company_name} coming soon!`,
                            });
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Navigate to the customer portal in the same tab
                            const portalUrl = `/portal/client/${client.id}`;
                            window.location.href = portalUrl;
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Portal
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Navigate to analytics tab and filter by this client
                            const analyticsTab = document.querySelector('[value="analytics"]') as HTMLElement;
                            if (analyticsTab) {
                              analyticsTab.click();
                              toast({
                                title: "Analytics",
                                description: `Viewing analytics for ${client.company_name}`,
                              });
                            }
                          }}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="safescan" className="space-y-4">
            <div className="grid gap-6">
              {clients.map((client) => (
                <Card key={client.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {client.company_name} - SafeScan Security Suite
                    </CardTitle>
                    <CardDescription>
                      Complete security scanning for documents, emails, and links
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Document Scanning */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Document Scanning (SafeDoc)
                      </h4>
                      <SafeDocScanner 
                        mspId={msp.id}
                        clientId={client.id}
                        userEmail={client.contact_email}
                      />
                    </div>

                    {/* Email Scanning */}
                    <div className="border rounded-lg p-4 opacity-60">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Email Scanning (SafeMail)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Phishing protection and email threat detection
                      </p>
                      <Button variant="outline" disabled className="w-full">
                        <Clock className="h-4 w-4 mr-2" />
                        Coming Soon
                      </Button>
                    </div>

                    {/* Link Scanning */}
                    <div className="border rounded-lg p-4 opacity-60">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Link Scanning (SafeLink)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        URL reputation checking and malicious link detection
                      </p>
                      <Button variant="outline" disabled className="w-full">
                        <Clock className="h-4 w-4 mr-2" />
                        Coming Soon
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {clients.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Clients Yet</h3>
                    <p className="text-muted-foreground mb-4">Add clients to start using SafeScan</p>
                    <Button onClick={() => setShowCreateClient(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Client
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <MSPRevenueOptimizer />
          </TabsContent>

          <TabsContent value="scorecards" className="space-y-4">
            <MSPClientRiskScorecard />
          </TabsContent>

          <TabsContent value="roi" className="space-y-4">
            <MSPROICalculator />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <MSPExecutiveBriefing />
          </TabsContent>

          <TabsContent value="profit-analytics" className="space-y-4">
            <MSPProfitAnalytics mspId={msp?.id || ''} />
          </TabsContent>

          <TabsContent value="upselling" className="space-y-4">
            <MSPUpsellingEngine mspId={msp?.id || ''} />
          </TabsContent>

          <TabsContent value="churn" className="space-y-4">
            <MSPChurnPrediction mspId={msp?.id || ''} />
          </TabsContent>

          <TabsContent value="benchmarks" className="space-y-4">
            <MSPCompetitiveBenchmarks mspId={msp?.id || ''} />
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <MSPLeadScoring mspId={msp?.id || ''} />
          </TabsContent>

          <TabsContent value="safedesk" className="space-y-4">
            <HelpdeskDashboard />
          </TabsContent>

          <TabsContent value="ultriumgpt" className="space-y-4">
            <UltriumGPTAssistant />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="business-intel" className="space-y-4">
            <BusinessIntelligence />
          </TabsContent>

          <TabsContent value="client-portal" className="space-y-4">
            <ClientPortal />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <AnnouncementManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success mb-2">
                    ${metrics.monthlyRevenue.toFixed(2)}/month
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average of ${metrics.averageRevenuePerClient.toFixed(2)} per client
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Client Retention</span>
                      <span className="text-sm font-medium">
                        {metrics.activeClients > 0 ? '100%' : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Users/Client</span>
                      <span className="text-sm font-medium">
                        {metrics.activeClients > 0 ? (metrics.totalUsers / metrics.activeClients).toFixed(1) : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Monthly Growth</span>
                      <span className="text-sm font-medium">
                        {metrics.totalClients > 0 ? 'TBD' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MSPControlCenter;