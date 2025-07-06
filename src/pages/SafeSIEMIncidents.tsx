import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Plus,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  Activity,
  Target,
  Calendar,
  User,
  Search,
  Filter,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'investigating' | 'escalated' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  assigned_at: string | null;
  sla_deadline: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  escalation_level: number;
  source_event_id: string | null;
  tags: string[];
  category: string;
  affected_systems: string[];
  impact_assessment: string | null;
  created_at: string;
  updated_at: string;
}

interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

interface IncidentActivity {
  id: string;
  incident_id: string;
  activity_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

const SafeSIEMIncidents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentComments, setIncidentComments] = useState<IncidentComment[]>([]);
  const [incidentActivities, setIncidentActivities] = useState<IncidentActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newComment, setNewComment] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state for creating new incident
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: 'Security Incident',
    tags: [] as string[],
    affected_systems: [] as string[]
  });

  useEffect(() => {
    if (user) {
      loadIncidents();
    }
  }, [user]);

  const loadIncidents = async () => {
    try {
      if (!user?.id) return;
      
      const { data: incidentsData, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading incidents:', error);
        toast({
          title: "Error",
          description: "Failed to load incidents",
          variant: "destructive",
        });
        return;
      }

      if (incidentsData) {
        setIncidents(incidentsData as Incident[]);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
    }
  };

  const loadIncidentDetails = async (incidentId: string) => {
    try {
      // Load comments
      const { data: comments, error: commentsError } = await supabase
        .from('incident_comments')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error loading comments:', commentsError);
      } else {
        setIncidentComments(comments as IncidentComment[]);
      }

      // Load activities
      const { data: activities, error: activitiesError } = await supabase
        .from('incident_activities')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });

      if (activitiesError) {
        console.error('Error loading activities:', activitiesError);
      } else {
        setIncidentActivities(activities as IncidentActivity[]);
      }
    } catch (error) {
      console.error('Error loading incident details:', error);
    }
  };

  const handleCreateIncident = async () => {
    try {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('incidents')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          severity: formData.severity,
          category: formData.category,
          tags: formData.tags,
          affected_systems: formData.affected_systems,
          sla_deadline: new Date(Date.now() + (4 * 60 * 60 * 1000)).toISOString(), // 4 hours from now
          response_sla_minutes: formData.priority === 'critical' ? 60 : formData.priority === 'high' ? 240 : 480,
          resolution_sla_minutes: formData.priority === 'critical' ? 240 : formData.priority === 'high' ? 1440 : 2880
        });

      if (error) {
        console.error('Error creating incident:', error);
        toast({
          title: "Error",
          description: "Failed to create incident",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Incident Created",
        description: "New incident has been created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadIncidents();
    } catch (error) {
      console.error('Error creating incident:', error);
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: Incident['status']) => {
    try {
      const updates: any = { status };
      
      // Set timestamps based on status
      if (status === 'investigating' && !selectedIncident?.first_response_at) {
        updates.first_response_at = new Date().toISOString();
      }
      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('incidents')
        .update(updates)
        .eq('id', incidentId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating incident status:', error);
        toast({
          title: "Error",
          description: "Failed to update incident status",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId ? { ...incident, ...updates } : incident
      ));

      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(prev => prev ? { ...prev, ...updates } : null);
      }

      toast({
        title: "Incident Updated",
        description: `Incident status changed to ${status}`,
      });
    } catch (error) {
      console.error('Error updating incident status:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedIncident) return;

    try {
      const { error } = await supabase
        .from('incident_comments')
        .insert({
          incident_id: selectedIncident.id,
          user_id: user?.id,
          comment: newComment,
          is_internal: false
        });

      if (error) {
        console.error('Error adding comment:', error);
        toast({
          title: "Error",
          description: "Failed to add comment",
          variant: "destructive",
        });
        return;
      }

      setNewComment('');
      loadIncidentDetails(selectedIncident.id);
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      severity: 'medium',
      category: 'Security Incident',
      tags: [],
      affected_systems: []
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50';
      case 'assigned': return 'text-blue-600 bg-blue-50';
      case 'investigating': return 'text-orange-600 bg-orange-50';
      case 'escalated': return 'text-purple-600 bg-purple-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'closed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (selectedIncident) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIncident(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{selectedIncident.title}</h1>
              <p className="text-muted-foreground">
                Created {new Date(selectedIncident.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(selectedIncident.priority)}>
              {selectedIncident.priority.toUpperCase()}
            </Badge>
            <Badge className={getStatusColor(selectedIncident.status)}>
              {selectedIncident.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Details */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedIncident.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <p className="text-sm">{selectedIncident.category}</p>
                  </div>
                  <div>
                    <Label>Affected Systems</Label>
                    <p className="text-sm">
                      {selectedIncident.affected_systems.length > 0 
                        ? selectedIncident.affected_systems.join(', ')
                        : 'None specified'
                      }
                    </p>
                  </div>
                </div>

                {selectedIncident.tags.length > 0 && (
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedIncident.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({incidentComments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {incidentComments.map((comment) => (
                    <div key={comment.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">User</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2"
                  />
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Change Status</Label>
                  <Select
                    value={selectedIncident.status}
                    onValueChange={(status) => updateIncidentStatus(selectedIncident.id, status as Incident['status'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* SLA Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  SLA Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedIncident.sla_deadline && (
                  <div className={`p-3 rounded-lg ${isOverdue(selectedIncident.sla_deadline) ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {isOverdue(selectedIncident.sla_deadline) ? 'OVERDUE' : 'Due'}
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      {new Date(selectedIncident.sla_deadline).toLocaleString()}
                    </p>
                  </div>
                )}
                
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>First Response:</span>
                    <span className={selectedIncident.first_response_at ? 'text-green-600' : 'text-red-600'}>
                      {selectedIncident.first_response_at ? '✓' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolution:</span>
                    <span className={selectedIncident.resolved_at ? 'text-green-600' : 'text-red-600'}>
                      {selectedIncident.resolved_at ? '✓' : 'Pending'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {incidentActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/safesiem')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Incident Response
            </h1>
            <p className="text-muted-foreground">
              Manage security incidents with automated workflows and SLA tracking
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Incident</DialogTitle>
              <DialogDescription>
                Create a new security incident for tracking and resolution
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the incident"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the incident..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, priority: value as any }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={formData.severity} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, severity: value as any }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateIncident}>
                Create Incident
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Incidents Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No incidents match your search criteria.' : 'No incidents have been created yet.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Incident
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredIncidents.map((incident) => (
            <Card 
              key={incident.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedIncident(incident);
                loadIncidentDetails(incident.id);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{incident.title}</h3>
                      <Badge className={getPriorityColor(incident.priority)}>
                        {incident.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {incident.sla_deadline && isOverdue(incident.sla_deadline) && (
                        <Badge variant="destructive">OVERDUE</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {incident.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created: {new Date(incident.created_at).toLocaleDateString()}</span>
                      {incident.sla_deadline && (
                        <span>SLA: {new Date(incident.sla_deadline).toLocaleDateString()}</span>
                      )}
                      <span>Category: {incident.category}</span>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SafeSIEMIncidents;