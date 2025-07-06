import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Palette, Users, Settings, Upload, Eye, Check, X, 
  Building2, Globe, Mail, Crown, AlertCircle
} from 'lucide-react'
import { useMSPClientWhiteLabel } from '@/hooks/useMSPClientWhiteLabel'
import { MSPClientWhiteLabelConfig } from '@/types/whiteLabel'
import { useToast } from '@/hooks/use-toast'

export const MSPClientBrandingManager = () => {
  const { 
    configs, 
    changeRequests, 
    loading, 
    createClientConfig, 
    updateClientConfig, 
    approveChangeRequest,
    uploadClientFile 
  } = useMSPClientWhiteLabel()
  
  const [selectedConfig, setSelectedConfig] = useState<MSPClientWhiteLabelConfig | null>(null)
  const [newClientName, setNewClientName] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const { toast } = useToast()

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return
    
    const clientId = `client-${Date.now()}`
    await createClientConfig(clientId, newClientName)
    setNewClientName('')
  }

  const handleConfigUpdate = async (configId: string, field: string, value: any) => {
    await updateClientConfig(configId, { [field]: value })
  }

  const handleFileUpload = async (configId: string, file: File, type: 'logo' | 'favicon') => {
    await uploadClientFile(configId, file, type)
  }

  const handleApproval = async (requestId: string, approved: boolean) => {
    await approveChangeRequest(requestId, approved, reviewNotes)
    setReviewNotes('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Client Branding Management</h2>
          <p className="text-muted-foreground">Manage white-label configurations for your clients</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent">
              <Building2 className="w-4 h-4 mr-2" />
              Add Client Branding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Client Branding</DialogTitle>
              <DialogDescription>Set up white-label branding for a new client</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Enter client company name"
                />
              </div>
              <Button onClick={handleCreateClient} disabled={loading}>
                Create Configuration
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Change Requests Panel */}
      {changeRequests.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
              <AlertCircle className="w-5 h-5 mr-2" />
              Pending Approval Requests ({changeRequests.length})
            </CardTitle>
            <CardDescription>Client branding change requests awaiting your review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {changeRequests.map((request) => (
              <div key={request.id} className="p-4 bg-card rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">Change Request</div>
                    <div className="text-sm text-muted-foreground">
                      Requested {new Date(request.created_at!).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="secondary">{request.request_type}</Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <Label>Requested Changes:</Label>
                  <div className="text-sm bg-muted p-2 rounded">
                    {JSON.stringify(request.changes, null, 2)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`notes-${request.id}`}>Review Notes (Optional)</Label>
                    <Textarea
                      id={`notes-${request.id}`}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your decision..."
                      className="h-20"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleApproval(request.id!, true)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleApproval(request.id!, false)}
                      variant="destructive"
                      disabled={loading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Client Configurations */}
      <div className="grid grid-cols-1 gap-6">
        {configs.map((config) => (
          <Card key={config.id} className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-primary" />
                    {config.client_name}
                  </CardTitle>
                  <CardDescription>White-label branding configuration</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={config.is_active ? "default" : "secondary"}>
                    {config.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Configure {config.client_name} Branding</DialogTitle>
                        <DialogDescription>Customize the white-label appearance for this client</DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="branding" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="branding">Branding</TabsTrigger>
                          <TabsTrigger value="colors">Colors</TabsTrigger>
                          <TabsTrigger value="settings">Settings</TabsTrigger>
                          <TabsTrigger value="permissions">Permissions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="branding" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Company Name</Label>
                              <Input
                                value={config.company_name}
                                onChange={(e) => handleConfigUpdate(config.id!, 'company_name', e.target.value)}
                                placeholder="Client company name"
                              />
                            </div>
                            <div>
                              <Label>Custom Domain</Label>
                              <Input
                                value={config.custom_domain}
                                onChange={(e) => handleConfigUpdate(config.id!, 'custom_domain', e.target.value)}
                                placeholder="client.yourdomain.com"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label>Footer Text</Label>
                            <Input
                              value={config.footer_text}
                              onChange={(e) => handleConfigUpdate(config.id!, 'footer_text', e.target.value)}
                              placeholder="Powered by..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Company Logo</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFileUpload(config.id!, file, 'logo')
                                  }}
                                />
                                <Upload className="w-4 h-4" />
                              </div>
                              {config.company_logo && (
                                <img src={config.company_logo} alt="Logo" className="w-16 h-16 mt-2 object-contain" />
                              )}
                            </div>
                            <div>
                              <Label>Favicon</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFileUpload(config.id!, file, 'favicon')
                                  }}
                                />
                                <Upload className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="colors" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Primary Color</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="color"
                                  value={config.primary_color}
                                  onChange={(e) => handleConfigUpdate(config.id!, 'primary_color', e.target.value)}
                                  className="w-12 h-12 p-1"
                                />
                                <Input
                                  value={config.primary_color}
                                  onChange={(e) => handleConfigUpdate(config.id!, 'primary_color', e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Secondary Color</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="color"
                                  value={config.secondary_color}
                                  onChange={(e) => handleConfigUpdate(config.id!, 'secondary_color', e.target.value)}
                                  className="w-12 h-12 p-1"
                                />
                                <Input
                                  value={config.secondary_color}
                                  onChange={(e) => handleConfigUpdate(config.id!, 'secondary_color', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Hide "Powered By" Branding</Label>
                                <p className="text-sm text-muted-foreground">Remove UltriumGPT branding from client interface</p>
                              </div>
                              <Switch
                                checked={config.hide_powered_by}
                                onCheckedChange={(checked) => handleConfigUpdate(config.id!, 'hide_powered_by', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Custom Login Page</Label>
                                <p className="text-sm text-muted-foreground">Use client-branded login page</p>
                              </div>
                              <Switch
                                checked={config.custom_login_page}
                                onCheckedChange={(checked) => handleConfigUpdate(config.id!, 'custom_login_page', checked)}
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="permissions" className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Enable Co-Management</Label>
                                <p className="text-sm text-muted-foreground">Allow client to participate in branding management</p>
                              </div>
                              <Switch
                                checked={config.co_management_enabled}
                                onCheckedChange={(checked) => handleConfigUpdate(config.id!, 'co_management_enabled', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Client Can Edit</Label>
                                <p className="text-sm text-muted-foreground">Allow client to make direct changes</p>
                              </div>
                              <Switch
                                checked={config.client_can_edit}
                                onCheckedChange={(checked) => handleConfigUpdate(config.id!, 'client_can_edit', checked)}
                                disabled={!config.co_management_enabled}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>MSP Approval Required</Label>
                                <p className="text-sm text-muted-foreground">Require MSP approval for client changes</p>
                              </div>
                              <Switch
                                checked={config.msp_approval_required}
                                onCheckedChange={(checked) => handleConfigUpdate(config.id!, 'msp_approval_required', checked)}
                                disabled={!config.co_management_enabled}
                              />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: config.primary_color }}>
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Brand Colors</div>
                    <div className="text-sm text-muted-foreground">Primary: {config.primary_color}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Globe className="w-10 h-10 p-2 bg-muted rounded-full" />
                  <div>
                    <div className="font-medium">Domain</div>
                    <div className="text-sm text-muted-foreground">
                      {config.custom_domain || 'No custom domain'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="w-10 h-10 p-2 bg-muted rounded-full" />
                  <div>
                    <div className="font-medium">Co-Management</div>
                    <div className="text-sm text-muted-foreground">
                      {config.co_management_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {configs.length === 0 && (
        <Card className="text-center p-8">
          <CardContent>
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Client Branding Configurations</h3>
            <p className="text-muted-foreground mb-4">
              Create white-label branding configurations for your clients to provide a seamless, branded experience.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Building2 className="w-4 h-4 mr-2" />
                  Create First Configuration
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}