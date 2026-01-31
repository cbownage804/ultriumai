import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Star, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, 
  TrendingDown, Users, AlertCircle, BarChart3, Award,
  Send, RefreshCw, Settings
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface CSATAnalysis {
  overall_score: number;
  score_trend: string;
  trend_percentage: number;
  satisfaction_breakdown: {
    very_satisfied: number;
    satisfied: number;
    neutral: number;
    dissatisfied: number;
    very_dissatisfied: number;
  };
  key_themes: Array<{
    theme: string;
    sentiment: string;
    frequency: number;
    impact_score: number;
  }>;
  improvement_areas: Array<{
    area: string;
    priority: string;
    current_score: number;
    target_score: number;
    recommendations: string[];
  }>;
  nps_score: number;
  executive_summary: string;
}

export function CSATSurveySystem() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [csatAnalysis, setCsatAnalysis] = useState<CSATAnalysis | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  const mockSurveyResponses = [
    { rating: 5, comment: 'Excellent service, resolved quickly', technician: 'John Smith', ticket_id: 'TKT-1234' },
    { rating: 4, comment: 'Good support but took a bit long', technician: 'Sarah Johnson', ticket_id: 'TKT-1235' },
    { rating: 5, comment: 'Very professional and knowledgeable', technician: 'John Smith', ticket_id: 'TKT-1236' },
    { rating: 3, comment: 'Issue resolved but communication could improve', technician: 'Mike Chen', ticket_id: 'TKT-1237' },
    { rating: 2, comment: 'Had to follow up multiple times', technician: 'Emily Davis', ticket_id: 'TKT-1238' }
  ];

  const analyzeCSAT = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-csat-analyzer', {
        body: {
          surveyResponses: mockSurveyResponses,
          ticketData: {
            total_tickets: 245,
            resolved_tickets: 220,
            avg_resolution_time: '4.5 hours'
          },
          historicalCSAT: {
            last_month: 4.1,
            three_months_ago: 3.9,
            six_months_ago: 3.7
          }
        }
      });

      if (error) throw error;

      if (data?.success && data.analysis) {
        setCsatAnalysis(data.analysis);
        toast({
          title: "CSAT Analysis Complete",
          description: `Overall Score: ${data.analysis.overall_score}/5`,
        });
      }
    } catch (error) {
      console.error('CSAT analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze CSAT data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitSurvey = () => {
    if (!selectedRating) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Survey Submitted",
      description: "Thank you for your feedback!"
    });
    setSelectedRating(null);
    setFeedback('');
  };

  const StarRating = ({ rating, onSelect }: { rating: number | null; onSelect: (r: number) => void }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onSelect(star)}
          className={`p-2 rounded-full transition-colors ${
            rating && star <= rating 
              ? 'text-yellow-500 bg-yellow-50' 
              : 'text-gray-300 hover:text-yellow-400'
          }`}
        >
          <Star className="h-8 w-8 fill-current" />
        </button>
      ))}
    </div>
  );

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="surveys">Surveys</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="preview">Survey Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">4.3</p>
                    <p className="text-sm text-muted-foreground">Average CSAT</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">+12%</p>
                    <p className="text-sm text-muted-foreground">vs Last Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-sm text-muted-foreground">Responses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">45</p>
                    <p className="text-sm text-muted-foreground">NPS Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Satisfaction Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Very Satisfied (5)', value: 45, color: 'bg-green-500' },
                  { label: 'Satisfied (4)', value: 30, color: 'bg-green-400' },
                  { label: 'Neutral (3)', value: 15, color: 'bg-yellow-400' },
                  { label: 'Dissatisfied (2)', value: 7, color: 'bg-orange-400' },
                  { label: 'Very Dissatisfied (1)', value: 3, color: 'bg-red-500' }
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Survey Responses</CardTitle>
                <Button variant="outline" size="sm">
                  Export Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockSurveyResponses.map((response, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < response.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{response.comment}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Ticket: {response.ticket_id}</span>
                        <span>Tech: {response.technician}</span>
                      </div>
                    </div>
                    <Badge variant={response.rating >= 4 ? 'default' : response.rating === 3 ? 'secondary' : 'destructive'}>
                      {response.rating >= 4 ? 'Positive' : response.rating === 3 ? 'Neutral' : 'Negative'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    AI CSAT Analysis
                  </CardTitle>
                  <CardDescription>
                    AI-powered insights from customer satisfaction data
                  </CardDescription>
                </div>
                <Button onClick={analyzeCSAT} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  Analyze Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {csatAnalysis ? (
                <div className="space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Executive Summary</h4>
                    <p className="text-sm text-muted-foreground">{csatAnalysis.executive_summary}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-3xl font-bold text-primary">{csatAnalysis.overall_score}</p>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className={`text-3xl font-bold ${csatAnalysis.score_trend === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
                        {csatAnalysis.trend_percentage > 0 ? '+' : ''}{csatAnalysis.trend_percentage}%
                      </p>
                      <p className="text-sm text-muted-foreground">Trend</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-3xl font-bold">{csatAnalysis.nps_score}</p>
                      <p className="text-sm text-muted-foreground">NPS Score</p>
                    </div>
                  </div>

                  {csatAnalysis.key_themes && (
                    <div>
                      <h4 className="font-semibold mb-3">Key Themes</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        {csatAnalysis.key_themes.map((theme, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{theme.theme}</p>
                              <p className={`text-sm ${getSentimentColor(theme.sentiment)}`}>
                                {theme.sentiment} sentiment
                              </p>
                            </div>
                            <Badge>{theme.frequency} mentions</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {csatAnalysis.improvement_areas && (
                    <div>
                      <h4 className="font-semibold mb-3">Improvement Areas</h4>
                      <div className="space-y-3">
                        {csatAnalysis.improvement_areas.map((area, idx) => (
                          <div key={idx} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{area.area}</span>
                              <Badge variant={area.priority === 'high' ? 'destructive' : area.priority === 'medium' ? 'default' : 'secondary'}>
                                {area.priority} priority
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span>Current: {area.current_score}</span>
                                <span>→</span>
                                <span>Target: {area.target_score}</span>
                              </div>
                              <ul className="text-sm text-muted-foreground">
                                {area.recommendations.map((rec, rIdx) => (
                                  <li key={rIdx}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Analyze Data" to generate AI-powered insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <Award className="h-12 w-12 mx-auto text-primary mb-2" />
              <CardTitle>How was your experience?</CardTitle>
              <CardDescription>
                Your feedback helps us improve our service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <StarRating rating={selectedRating} onSelect={setSelectedRating} />
              </div>

              <Textarea
                placeholder="Tell us more about your experience (optional)..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />

              <Button onClick={submitSurvey} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </Button>

              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <button className="flex items-center gap-1 hover:text-foreground">
                  <ThumbsUp className="h-4 w-4" /> Quick Positive
                </button>
                <button className="flex items-center gap-1 hover:text-foreground">
                  <ThumbsDown className="h-4 w-4" /> Report Issue
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
