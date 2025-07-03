import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MessageSquare, Users, Clock, Download, Calendar } from "lucide-react";

const CustomGPTAnalyze = () => {
  // Mock data for charts
  const weeklyData = [
    { name: 'Mon', messages: 12, users: 8 },
    { name: 'Tue', messages: 19, users: 12 },
    { name: 'Wed', messages: 15, users: 10 },
    { name: 'Thu', messages: 22, users: 15 },
    { name: 'Fri', messages: 28, users: 18 },
    { name: 'Sat', messages: 18, users: 14 },
    { name: 'Sun', messages: 25, users: 16 }
  ];

  const monthlyData = [
    { name: 'Jan', conversations: 45, satisfaction: 4.2 },
    { name: 'Feb', conversations: 52, satisfaction: 4.3 },
    { name: 'Mar', conversations: 48, satisfaction: 4.1 },
    { name: 'Apr', conversations: 61, satisfaction: 4.5 },
    { name: 'May', conversations: 55, satisfaction: 4.4 },
    { name: 'Jun', conversations: 67, satisfaction: 4.6 }
  ];

  const topicData = [
    { name: 'Product Support', value: 35, color: '#3b82f6' },
    { name: 'General Questions', value: 25, color: '#8b5cf6' },
    { name: 'Technical Issues', value: 20, color: '#ef4444' },
    { name: 'Billing', value: 15, color: '#f59e0b' },
    { name: 'Other', value: 5, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your Custom GPT's performance and usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Messages</span>
            </div>
            <div className="text-2xl font-bold mt-2">1,247</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Active Users</span>
            </div>
            <div className="text-2xl font-bold mt-2">342</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">+8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Avg Response Time</span>
            </div>
            <div className="text-2xl font-bold mt-2">1.2s</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">-0.3s improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Satisfaction Score</span>
            </div>
            <div className="text-2xl font-bold mt-2">4.4/5</div>
            <div className="mt-2">
              <Progress value={88} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Messages and active users over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#3b82f6" name="Messages" />
                <Bar dataKey="users" fill="#8b5cf6" name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Conversations and satisfaction over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="conversations" stroke="#3b82f6" name="Conversations" />
                <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#ef4444" name="Satisfaction" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Topic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Topics</CardTitle>
            <CardDescription>What users are asking about most</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={topicData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Success Rate</span>
              <div className="flex items-center gap-2">
                <Progress value={94} className="w-20" />
                <span className="text-sm font-medium">94%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">User Retention</span>
              <div className="flex items-center gap-2">
                <Progress value={78} className="w-20" />
                <span className="text-sm font-medium">78%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Response Accuracy</span>
              <div className="flex items-center gap-2">
                <Progress value={91} className="w-20" />
                <span className="text-sm font-medium">91%</span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <h4 className="font-medium">Recent Feedback</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Positive</Badge>
                  <span className="text-sm">"Very helpful and accurate responses"</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Positive</Badge>
                  <span className="text-sm">"Quick and knowledgeable"</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Neutral</Badge>
                  <span className="text-sm">"Could be more detailed"</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomGPTAnalyze;