import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Users, TrendingUp, Plus, Settings, Eye, BarChart3, Trash2, Sliders } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { Skeleton } from "@/components/ui/skeleton";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const GPTDashboard = () => {
  const navigate = useNavigate();
  const { gpts: customGPTs, isLoading, deleteGPT } = useCustomGPTs();
  const [gptToDelete, setGptToDelete] = useState<{ id: string; name: string } | null>(null);

  const stats = {
    totalGPTs: customGPTs.length,
    activeGPTs: customGPTs.filter(gpt => gpt.is_active).length,
    totalChats: customGPTs.reduce((sum, gpt) => sum + (gpt.chat_count || 0), 0),
    publicGPTs: customGPTs.filter(gpt => gpt.sharing_level === 'public').length
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            AI Studio Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor your custom AI assistants
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/gpt/build')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New GPT
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total GPTs</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGPTs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeGPTs} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChats}</div>
            <p className="text-xs text-muted-foreground">
              Across all GPTs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public GPTs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publicGPTs}</div>
            <p className="text-xs text-muted-foreground">
              Shared publicly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalGPTs > 0 ? Math.round(stats.totalChats / stats.totalGPTs) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Chats per GPT
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/gpt/build')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              Build New GPT
            </CardTitle>
            <CardDescription>
              Create a custom AI assistant from scratch
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/gpt/templates')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              Browse Templates
            </CardTitle>
            <CardDescription>
              Start with pre-built GPT templates
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/gpt/chat')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Test & Chat
            </CardTitle>
            <CardDescription>
              Interact with your custom GPTs
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              View Analytics
            </CardTitle>
            <CardDescription>
              Monitor performance and usage
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent GPTs */}
      <Card>
        <CardHeader>
          <CardTitle>Your Custom GPTs</CardTitle>
          <CardDescription>
            Manage and monitor your AI assistants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customGPTs.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No GPTs Created Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom GPT to get started
              </p>
              <Button onClick={() => navigate('/dashboard/gpt/build')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First GPT
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {customGPTs.slice(0, 5).map((gpt) => (
                <div key={gpt.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{gpt.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {gpt.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={gpt.is_active ? 'default' : 'secondary'}>
                      {gpt.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {gpt.chat_count || 0} chats
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/chat/${gpt.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/gpt/build?edit=${gpt.id}`)}>
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/ai-studio/settings/${gpt.id}`)}>
                      <Sliders className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setGptToDelete({ id: gpt.id, name: gpt.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {customGPTs.length > 5 && (
                <Button variant="outline" className="w-full">
                  View All GPTs ({customGPTs.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!gptToDelete} onOpenChange={(open) => !open && setGptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete GPT?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{gptToDelete?.name}"? This action cannot be undone and will remove all associated conversation history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (gptToDelete) {
                  await deleteGPT(gptToDelete.id);
                  setGptToDelete(null);
                }
              }}
            >
              Delete GPT
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};