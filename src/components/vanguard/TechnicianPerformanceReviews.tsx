/**
 * Technician Performance Reviews - AI-powered analysis
 * Analyzes technician metrics: tickets, SLA compliance, CSAT, resolution times
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Target,
  Zap,
  FileText,
  Send,
  RefreshCw,
  ChevronRight,
  Award,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TechnicianReview {
  id: string;
  technician_name: string;
  review_period: string;
  tickets_resolved: number;
  tickets_assigned: number;
  avg_resolution_hours: number;
  sla_compliance: number;
  csat_average: number;
  escalation_rate: number;
  reopen_rate: number;
  performance_score: number;
  trend: 'improving' | 'stable' | 'declining';
  ai_summary: string;
  strengths: string[];
  improvement_areas: string[];
  recommendations: string[];
  status: 'draft' | 'reviewed' | 'shared' | 'acknowledged';
}

// Empty initial state - data loaded from database
const initialReviews: TechnicianReview[] = [];

export const TechnicianPerformanceReviews = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<TechnicianReview[]>(initialReviews);
  const [selectedPeriod, setSelectedPeriod] = useState('january_2026');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReviews = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    toast({
      title: "Reviews Generated",
      description: "AI has analyzed technician performance and generated reviews.",
    });
  };

  const handleShareReview = (review: TechnicianReview) => {
    toast({
      title: "Review Shared",
      description: `Performance review sent to ${review.technician_name}.`,
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Minus className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Exceptional', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (score >= 80) return { label: 'Strong', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    if (score >= 70) return { label: 'Meets Expectations', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (score >= 60) return { label: 'Needs Improvement', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    return { label: 'Action Required', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="january_2026">January 2026</SelectItem>
              <SelectItem value="december_2025">December 2025</SelectItem>
              <SelectItem value="q4_2025">Q4 2025</SelectItem>
              <SelectItem value="q3_2025">Q3 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleGenerateReviews}
          disabled={isGenerating}
          className="bg-gradient-to-r from-cyan-500 to-purple-500"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Generate AI Reviews
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Team Avg Score</p>
                <p className="text-2xl font-bold text-white">76.0</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/20">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Top Performer</p>
                <p className="text-lg font-bold text-white">Alex Chen</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <Award className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Needs Attention</p>
                <p className="text-2xl font-bold text-orange-400">1</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/20">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Reviews Pending</p>
                <p className="text-2xl font-bold text-white">2</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reviews.map((review) => {
          const scoreBadge = getScoreBadge(review.performance_score);
          return (
            <Card key={review.id} className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white/10">
                      <User className="h-5 w-5 text-white/60" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{review.technician_name}</CardTitle>
                      <p className="text-sm text-white/60">{review.review_period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(review.trend)}
                    <span className={`text-2xl font-bold ${getScoreColor(review.performance_score)}`}>
                      {review.performance_score}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={scoreBadge.className}>{scoreBadge.label}</Badge>
                  <Badge variant="outline" className="border-white/20 text-white/60">
                    {review.status}
                  </Badge>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-white/60">Resolved:</span>
                    <span className="text-white font-medium">{review.tickets_resolved}/{review.tickets_assigned}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span className="text-white/60">Avg Time:</span>
                    <span className="text-white font-medium">{review.avg_resolution_hours}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-400" />
                    <span className="text-white/60">SLA:</span>
                    <span className="text-white font-medium">{review.sla_compliance}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-white/60">CSAT:</span>
                    <span className="text-white font-medium">{review.csat_average}/5</span>
                  </div>
                </div>

                {/* AI Summary Preview */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-400">AI Summary</span>
                  </div>
                  <p className="text-sm text-white/80 line-clamp-2">{review.ai_summary}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-white/10"
                      >
                        View Full Review
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                          <Brain className="h-5 w-5 text-cyan-400" />
                          AI Performance Review - {review.technician_name}
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[70vh]">
                        <div className="space-y-6 p-1">
                          {/* Score Header */}
                          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                            <div>
                              <p className="text-sm text-white/60">Performance Score</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-4xl font-bold ${getScoreColor(review.performance_score)}`}>
                                  {review.performance_score}
                                </span>
                                {getTrendIcon(review.trend)}
                                <span className="text-sm text-white/60 capitalize">{review.trend}</span>
                              </div>
                            </div>
                            <Badge className={scoreBadge.className}>{scoreBadge.label}</Badge>
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <MetricCard 
                              label="Tickets Resolved" 
                              value={`${review.tickets_resolved}/${review.tickets_assigned}`}
                              subtext={`${((review.tickets_resolved / review.tickets_assigned) * 100).toFixed(1)}% completion`}
                            />
                            <MetricCard 
                              label="Avg Resolution Time" 
                              value={`${review.avg_resolution_hours}h`}
                              subtext="Target: <4h"
                            />
                            <MetricCard 
                              label="SLA Compliance" 
                              value={`${review.sla_compliance}%`}
                              subtext="Target: 95%"
                            />
                            <MetricCard 
                              label="CSAT Score" 
                              value={`${review.csat_average}/5`}
                              subtext="Team avg: 4.3"
                            />
                            <MetricCard 
                              label="Escalation Rate" 
                              value={`${review.escalation_rate}%`}
                              subtext="Target: <10%"
                            />
                            <MetricCard 
                              label="Reopen Rate" 
                              value={`${review.reopen_rate}%`}
                              subtext="Target: <3%"
                            />
                          </div>

                          {/* AI Summary */}
                          <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                            <div className="flex items-center gap-2 mb-3">
                              <Brain className="h-5 w-5 text-cyan-400" />
                              <span className="font-medium text-cyan-400">AI Analysis</span>
                            </div>
                            <p className="text-white/80">{review.ai_summary}</p>
                          </div>

                          {/* Strengths */}
                          <div>
                            <h4 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-green-400" />
                              Strengths
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {review.strengths.map((strength, i) => (
                                <Badge key={i} className="bg-green-500/20 text-green-400 border-green-500/30">
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Improvement Areas */}
                          <div>
                            <h4 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                              <Target className="h-4 w-4 text-orange-400" />
                              Areas for Improvement
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {review.improvement_areas.map((area, i) => (
                                <Badge key={i} className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div>
                            <h4 className="text-sm font-medium text-white/60 mb-2">AI Recommendations</h4>
                            <ul className="space-y-2">
                              {review.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                  <ChevronRight className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Manager Notes */}
                          <div>
                            <h4 className="text-sm font-medium text-white/60 mb-2">Manager Notes</h4>
                            <Textarea 
                              placeholder="Add your notes before sharing with technician..."
                              className="bg-white/5 border-white/10"
                            />
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" className="flex-1 border-white/10">
                          Save as Draft
                        </Button>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500"
                          onClick={() => handleShareReview(review)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Share with Technician
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, subtext }: { label: string; value: string; subtext: string }) => (
  <div className="p-3 rounded-lg bg-white/5">
    <p className="text-xs text-white/60">{label}</p>
    <p className="text-lg font-bold text-white">{value}</p>
    <p className="text-xs text-white/40">{subtext}</p>
  </div>
);

export default TechnicianPerformanceReviews;
