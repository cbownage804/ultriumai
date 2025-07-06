import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Eye, Upload, Search, Filter } from "lucide-react";
import { useComplianceManager } from "@/hooks/useComplianceManager";
import { useToast } from "@/hooks/use-toast";

interface Evidence {
  id: string;
  framework: string;
  control_id: string;
  evidence_type: string;
  title: string;
  description: string | null;
  file_path: string | null;
  collected_at: string;
  collected_by: string | null;
  verification_status: string;
  metadata: any;
}

interface ComplianceEvidenceViewerProps {
  evidence: Evidence[];
  framework: string;
  onRefresh: () => void;
}

export const ComplianceEvidenceViewer = ({ evidence, framework, onRefresh }: ComplianceEvidenceViewerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newEvidence, setNewEvidence] = useState({
    controlId: '',
    title: '',
    description: '',
    type: 'document'
  });
  
  const { collectEvidence, loading } = useComplianceManager();
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: 'default',
      pending: 'secondary',
      rejected: 'destructive'
    } as const;
    
    const colors = {
      verified: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    return <FileText className="w-4 h-4" />;
  };

  const filteredEvidence = evidence.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.control_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.evidence_type === filterType;
    const matchesStatus = filterStatus === 'all' || item.verification_status === filterStatus;
    const matchesFramework = item.framework === framework;
    
    return matchesSearch && matchesType && matchesStatus && matchesFramework;
  });

  const handleUploadEvidence = async () => {
    if (!newEvidence.controlId || !newEvidence.title) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const result = await collectEvidence(
      framework,
      newEvidence.controlId,
      newEvidence.type,
      {
        title: newEvidence.title,
        description: newEvidence.description,
        sourceSystem: 'manual_upload'
      }
    );
    
    if (result.success) {
      toast({
        title: "Evidence Uploaded",
        description: "Evidence has been successfully collected"
      });
      setIsUploadDialogOpen(false);
      setNewEvidence({ controlId: '', title: '', description: '', type: 'document' });
      onRefresh();
    } else {
      toast({
        title: "Upload Failed",
        description: result.error || "Failed to upload evidence",
        variant: "destructive"
      });
    }
  };

  const evidenceTypes = [
    { value: 'screenshot', label: 'Screenshot' },
    { value: 'configuration', label: 'Configuration' },
    { value: 'log', label: 'Log File' },
    { value: 'document', label: 'Document' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Evidence</h2>
          <p className="text-muted-foreground">
            Evidence collection for {framework.toUpperCase()} framework
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Evidence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Compliance Evidence</DialogTitle>
              <DialogDescription>
                Add evidence for a specific control in the {framework.toUpperCase()} framework
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="control-id">Control ID *</Label>
                <Input
                  id="control-id"
                  placeholder="e.g., CC6.1, 164.312(a)(1)"
                  value={newEvidence.controlId}
                  onChange={(e) => setNewEvidence(prev => ({ ...prev, controlId: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="evidence-type">Evidence Type</Label>
                <Select value={newEvidence.type} onValueChange={(value) => setNewEvidence(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {evidenceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="evidence-title">Title *</Label>
                <Input
                  id="evidence-title"
                  placeholder="e.g., Password Policy Configuration"
                  value={newEvidence.title}
                  onChange={(e) => setNewEvidence(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="evidence-description">Description</Label>
                <Textarea
                  id="evidence-description"
                  placeholder="Describe what this evidence demonstrates..."
                  value={newEvidence.description}
                  onChange={(e) => setNewEvidence(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUploadEvidence} disabled={loading}>
                  Upload Evidence
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search evidence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {evidenceTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evidence List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvidence.length > 0 ? (
          filteredEvidence.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item.evidence_type)}
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  </div>
                  {getStatusBadge(item.verification_status)}
                </div>
                <CardDescription className="text-xs">
                  Control: {item.control_id}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{item.evidence_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collected:</span>
                    <span>{new Date(item.collected_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="capitalize">{item.collected_by || 'System'}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  {item.file_path && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Evidence Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? "No evidence matches your current search and filters"
                  : `No evidence has been collected for ${framework.toUpperCase()} yet`
                }
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload First Evidence
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};