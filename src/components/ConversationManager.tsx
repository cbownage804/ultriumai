import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { safeWindowOpen } from "@/utils/security";
import { devLog } from "@/lib/logger";
import { FileText, Upload, Download, Search, AlertCircle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConversationExport {
  id: string;
  conversation_id: string;
  format: 'txt' | 'json' | 'csv' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_size?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export const ConversationManager = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [exports, setExports] = useState<ConversationExport[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportFormat, setExportFormat] = useState<'txt' | 'json' | 'csv' | 'pdf'>('txt');
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadConversations();
      loadExports();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages(count)
        `)
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const conversationsWithCount = data?.map(conv => ({
        ...conv,
        message_count: conv.messages?.[0]?.count || 0
      })) || [];
      
      setConversations(conversationsWithCount);
    } catch (error) {
      devLog.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadExports = async () => {
    try {
      // This would be a custom table for tracking exports
      // For now, we'll simulate with empty array
      setExports([]);
    } catch (error) {
      devLog.error('Error loading exports:', error);
    }
  };

  const exportConversations = async () => {
    if (selectedConversations.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one conversation to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Call export function
      const { data, error } = await supabase.functions.invoke('chat-export', {
        body: {
          conversation_ids: selectedConversations,
          format: exportFormat,
          include_metadata: true
        }
      });

      if (error) throw error;

      // Create and download file
      const blob = new Blob([data.content], { 
        type: getContentType(exportFormat) 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversations_export.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Exported ${selectedConversations.length} conversation(s)`,
      });
      
      setSelectedConversations([]);
    } catch (error) {
      devLog.error('Error exporting conversations:', error);
      toast({
        title: "Error",
        description: "Failed to export conversations",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const deleteConversations = async () => {
    if (selectedConversations.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one conversation to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .in('id', selectedConversations)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted ${selectedConversations.length} conversation(s)`,
      });
      
      setSelectedConversations([]);
      await loadConversations();
    } catch (error) {
      devLog.error('Error deleting conversations:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversations",
        variant: "destructive",
      });
    }
  };

  const getContentType = (format: string) => {
    switch (format) {
      case 'json': return 'application/json';
      case 'csv': return 'text/csv';
      case 'pdf': return 'application/pdf';
      default: return 'text/plain';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleConversationSelection = (id: string) => {
    setSelectedConversations(prev =>
      prev.includes(id)
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const selectAllConversations = () => {
    if (selectedConversations.length === filteredConversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(filteredConversations.map(c => c.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conversation Manager</h2>
          <p className="text-muted-foreground">
            Export, backup, and manage your conversation history.
          </p>
        </div>
      </div>

      <Tabs defaultValue="conversations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="exports">Export History</TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          {/* Search and Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Conversations</CardTitle>
              <CardDescription>
                Select conversations to export or delete. Export formats include TXT, JSON, CSV, and PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={selectAllConversations}
                >
                  {selectedConversations.length === filteredConversations.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {selectedConversations.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm">
                    {selectedConversations.length} conversation(s) selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="exportFormat" className="text-sm">Format:</Label>
                    <select
                      id="exportFormat"
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="txt">TXT</option>
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={exportConversations}
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={deleteConversations}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversations List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Conversations ({filteredConversations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Conversations Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search term.' : 'Start chatting to create conversations.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedConversations.includes(conversation.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleConversationSelection(conversation.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedConversations.includes(conversation.id)}
                        onChange={() => toggleConversationSelection(conversation.id)}
                        className="w-4 h-4"
                      />
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{conversation.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{conversation.message_count || 0} messages</span>
                          <span>Created {formatDistanceToNow(new Date(conversation.created_at))} ago</span>
                          <span>Updated {formatDistanceToNow(new Date(conversation.updated_at))} ago</span>
                        </div>
                      </div>
                      
                      <Badge variant="outline">
                        {formatDistanceToNow(new Date(conversation.updated_at))} ago
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export History Tab */}
        <TabsContent value="exports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                View and download your previous conversation exports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exports.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Exports Yet</h3>
                  <p className="text-muted-foreground">
                    Export conversations from the Conversations tab to see them here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exports.map((exportItem) => (
                    <div
                      key={exportItem.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                    >
                      {getStatusIcon(exportItem.status)}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Export #{exportItem.id.slice(0, 8)}</span>
                          <Badge variant="outline" className="uppercase">
                            {exportItem.format}
                          </Badge>
                          <Badge 
                            variant={exportItem.status === 'completed' ? 'default' : 
                                   exportItem.status === 'failed' ? 'destructive' : 'secondary'}
                          >
                            {exportItem.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>Created {formatDistanceToNow(new Date(exportItem.created_at))} ago</span>
                          {exportItem.file_size && (
                            <span> • {(exportItem.file_size / 1024).toFixed(1)} KB</span>
                          )}
                          {exportItem.error_message && (
                            <span className="text-red-500"> • {exportItem.error_message}</span>
                          )}
                        </div>
                      </div>
                      
                      {exportItem.status === 'completed' && exportItem.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => safeWindowOpen(exportItem.file_url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};