import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, MessageSquare, Bot, Activity, TrendingUp, Clock } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

interface TeamAnalytics {
  total_conversations: number;
  total_messages: number;
  total_tokens: number;
  active_gpts: number;
  team_gpts: number;
  daily_usage: Array<{
    date: string;
    conversations: number;
    messages: number;
  }>;
  gpt_usage: Array<{
    name: string;
    conversations: number;
    tokens: number;
  }>;
  member_activity: Array<{
    user_name: string;
    conversations: number;
    last_active: string;
  }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f97316', '#eab308', '#22c55e'];

const TeamAnalytics = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("7");

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamAnalytics();
    }
  }, [selectedTeam, timeRange]);

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_memberships(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const teamsWithCounts = data.map(team => ({
        ...team,
        member_count: team.team_memberships.length
      }));

      setTeams(teamsWithCounts);
      if (teamsWithCounts.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsWithCounts[0].id);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadTeamAnalytics = async () => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get team GPTs
      const { data: teamGPTs, error: gptsError } = await supabase
        .from('custom_gpts')
        .select('id, name, chat_count')
        .eq('team_id', selectedTeam);

      if (gptsError) throw gptsError;

      const gptIds = teamGPTs?.map(gpt => gpt.id) || [];

      // Get analytics for team GPTs
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('gpt_analytics')
        .select('*')
        .in('gpt_id', gptIds)
        .gte('created_at', startDate.toISOString());

      if (analyticsError) throw analyticsError;

      // Process analytics data
      const totalConversations = new Set(analyticsData?.map(a => a.session_id)).size;
      const totalMessages = analyticsData?.filter(a => a.interaction_type === 'message').length || 0;
      const totalTokens = analyticsData?.reduce((sum, a) => sum + (a.tokens_used || 0), 0) || 0;

      // Daily usage data
      const dailyUsage = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = analyticsData?.filter(a => 
          a.created_at.startsWith(dateStr)
        ) || [];
        
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          conversations: new Set(dayData.map(a => a.session_id)).size,
          messages: dayData.filter(a => a.interaction_type === 'message').length
        };
      });

      // GPT usage data
      const gptUsage = teamGPTs?.map(gpt => {
        const gptAnalytics = analyticsData?.filter(a => a.gpt_id === gpt.id) || [];
        return {
          name: gpt.name,
          conversations: new Set(gptAnalytics.map(a => a.session_id)).size,
          tokens: gptAnalytics.reduce((sum, a) => sum + (a.tokens_used || 0), 0)
        };
      }) || [];

      // Member activity (mock data for now - would need to join with user profiles)
      const memberActivity = [
        { user_name: "Team Member 1", conversations: 12, last_active: "2 hours ago" },
        { user_name: "Team Member 2", conversations: 8, last_active: "1 day ago" },
        { user_name: "Team Member 3", conversations: 5, last_active: "3 days ago" }
      ];

      setAnalytics({
        total_conversations: totalConversations,
        total_messages: totalMessages,
        total_tokens: totalTokens,
        active_gpts: teamGPTs?.filter(gpt => gpt.chat_count > 0).length || 0,
        team_gpts: teamGPTs?.length || 0,
        daily_usage: dailyUsage,
        gpt_usage: gptUsage,
        member_activity: memberActivity
      });

    } catch (error) {
      console.error('Error loading team analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedTeam) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No teams available</h3>
          <p className="text-muted-foreground">Create a team to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Analytics</h2>
          <p className="text-muted-foreground">Monitor your team's GPT usage and performance.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : analytics ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_conversations}</div>
                <p className="text-xs text-muted-foreground">Across all team GPTs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_messages.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total messages processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active GPTs</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.active_gpts}</div>
                <p className="text-xs text-muted-foreground">of {analytics.team_gpts} total GPTs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_tokens.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">AI processing tokens</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Usage</CardTitle>
                <CardDescription>Conversations and messages over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.daily_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="conversations" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Conversations"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Messages"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GPT Performance</CardTitle>
                <CardDescription>Usage by individual GPTs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.gpt_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversations" fill="#3b82f6" name="Conversations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Team Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Team Member Activity</CardTitle>
              <CardDescription>Individual member usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.member_activity.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{member.user_name}</p>
                        <p className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Last active: {member.last_active}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {member.conversations} conversations
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No analytics data available for the selected period.</p>
        </div>
      )}
    </div>
  );
};

export default TeamAnalytics;