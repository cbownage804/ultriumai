import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Trophy, Target, BarChart3, Zap, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface CompetitiveBenchmark {
  id: string;
  metric_name: string;
  metric_value: number;
  industry_average: number;
  top_quartile: number;
  percentile_rank: number;
  trend_direction: 'up' | 'down' | 'stable';
  benchmark_date: string;
  data_source: string;
  recommendations: string[];
}

interface MSPCompetitiveBenchmarksProps {
  mspId: string;
}

export const MSPCompetitiveBenchmarks = ({ mspId }: MSPCompetitiveBenchmarksProps) => {
  const [benchmarks, setBenchmarks] = useState<CompetitiveBenchmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockData: CompetitiveBenchmark[] = [
      {
        id: '1',
        metric_name: 'Client Retention Rate',
        metric_value: 94.2,
        industry_average: 87.5,
        top_quartile: 92.0,
        percentile_rank: 85,
        trend_direction: 'up',
        benchmark_date: '2024-01-01',
        data_source: 'Industry Report 2024',
        recommendations: [
          'Maintain current retention strategies',
          'Share best practices with industry peers',
          'Consider offering retention consulting services'
        ]
      },
      {
        id: '2',
        metric_name: 'Profit Margin',
        metric_value: 28.5,
        industry_average: 25.2,
        top_quartile: 32.8,
        percentile_rank: 72,
        trend_direction: 'up',
        benchmark_date: '2024-01-01',
        data_source: 'MSP Benchmark Study',
        recommendations: [
          'Optimize service delivery processes',
          'Automate routine tasks',
          'Review pricing strategy for underperforming services'
        ]
      },
      {
        id: '3',
        metric_name: 'Average Response Time',
        metric_value: 12.3,
        industry_average: 18.7,
        top_quartile: 8.5,
        percentile_rank: 78,
        trend_direction: 'down',
        benchmark_date: '2024-01-01',
        data_source: 'Service Desk Analytics',
        recommendations: [
          'Implement AI-powered ticket routing',
          'Expand first-level support team',
          'Invest in proactive monitoring tools'
        ]
      },
      {
        id: '4',
        metric_name: 'Client Satisfaction Score',
        metric_value: 8.7,
        industry_average: 7.9,
        top_quartile: 9.2,
        percentile_rank: 68,
        trend_direction: 'stable',
        benchmark_date: '2024-01-01',
        data_source: 'Customer Survey Platform',
        recommendations: [
          'Focus on communication improvements',
          'Implement regular feedback loops',
          'Enhance service quality training'
        ]
      },
      {
        id: '5',
        metric_name: 'Revenue per Client',
        metric_value: 4200,
        industry_average: 3800,
        top_quartile: 5100,
        percentile_rank: 62,
        trend_direction: 'up',
        benchmark_date: '2024-01-01',
        data_source: 'Financial Benchmarks',
        recommendations: [
          'Develop premium service tiers',
          'Cross-sell complementary services',
          'Focus on high-value client acquisition'
        ]
      },
      {
        id: '6',
        metric_name: 'Security Incident Rate',
        metric_value: 0.8,
        industry_average: 2.1,
        top_quartile: 0.5,
        percentile_rank: 82,
        trend_direction: 'down',
        benchmark_date: '2024-01-01',
        data_source: 'Security Metrics Report',
        recommendations: [
          'Share security best practices',
          'Invest in advanced threat detection',
          'Maintain current security protocols'
        ]
      }
    ];

    setTimeout(() => {
      setBenchmarks(mockData);
      setIsLoading(false);
    }, 1000);
  }, [mspId]);

  const avgPercentile = benchmarks.length > 0 ? 
    benchmarks.reduce((sum, b) => sum + b.percentile_rank, 0) / benchmarks.length : 0;

  const topPerformingMetrics = benchmarks.filter(b => b.percentile_rank >= 75).length;
  const improvementNeeded = benchmarks.filter(b => b.percentile_rank < 50).length;

  const radarData = benchmarks.map(b => ({
    metric: b.metric_name.replace(/\s+/g, '\n'),
    yourScore: (b.metric_value / b.top_quartile) * 100,
    industry: (b.industry_average / b.top_quartile) * 100,
    topQuartile: 100
  }));

  const barChartData = benchmarks.map(b => ({
    name: b.metric_name,
    your_value: b.metric_value,
    industry_avg: b.industry_average,
    top_quartile: b.top_quartile
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Competitive Benchmarking</h2>
          <p className="text-muted-foreground">
            Compare your performance against industry standards and top performers
          </p>
        </div>
        <Button>
          <BarChart3 className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Percentile</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPercentile.toFixed(0)}th</div>
            <Progress value={avgPercentile} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              Industry ranking
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{topPerformingMetrics}</div>
            <div className="text-xs text-muted-foreground">
              Metrics above 75th percentile
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Improvement</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{improvementNeeded}</div>
            <div className="text-xs text-muted-foreground">
              Metrics below median
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitive Edge</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Strong</div>
            <Badge variant="default" className="mt-2">
              Top 25%
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="recommendations">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Radar</CardTitle>
                <CardDescription>
                  Compare your metrics across all categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar
                      name="Your Performance"
                      dataKey="yourScore"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Industry Average"
                      dataKey="industry"
                      stroke="hsl(var(--muted-foreground))"
                      fill="transparent"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                    <Radar
                      name="Top Quartile"
                      dataKey="topQuartile"
                      stroke="hsl(var(--secondary))"
                      fill="transparent"
                      strokeWidth={1}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Benchmark Comparison</CardTitle>
                <CardDescription>
                  Side-by-side performance comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData.slice(0, 4)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar 
                      dataKey="your_value" 
                      fill="hsl(var(--primary))" 
                      name="Your Performance"
                    />
                    <Bar 
                      dataKey="industry_avg" 
                      fill="hsl(var(--muted))" 
                      name="Industry Average"
                    />
                    <Bar 
                      dataKey="top_quartile" 
                      fill="hsl(var(--secondary))" 
                      name="Top Quartile"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid gap-4">
            {benchmarks.map((benchmark) => (
              <Card key={benchmark.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{benchmark.metric_name}</CardTitle>
                      <CardDescription>
                        Source: {benchmark.data_source} | Updated: {new Date(benchmark.benchmark_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={benchmark.percentile_rank >= 75 ? "default" : benchmark.percentile_rank >= 50 ? "secondary" : "destructive"}>
                        {benchmark.percentile_rank}th percentile
                      </Badge>
                      {benchmark.trend_direction === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {benchmark.trend_direction === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Your Performance</div>
                      <div className="text-2xl font-bold">{benchmark.metric_value.toLocaleString()}</div>
                      <div className={`text-xs ${
                        benchmark.metric_value > benchmark.industry_average ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {benchmark.metric_value > benchmark.industry_average ? '+' : ''}
                        {((benchmark.metric_value - benchmark.industry_average) / benchmark.industry_average * 100).toFixed(1)}% vs industry
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Industry Average</div>
                      <div className="text-xl font-semibold">{benchmark.industry_average.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Median performance</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Top Quartile</div>
                      <div className="text-xl font-semibold text-blue-600">{benchmark.top_quartile.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Best-in-class</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Gap to Excellence</div>
                      <div className="text-xl font-semibold">
                        {benchmark.metric_value < benchmark.top_quartile ? 
                          (benchmark.top_quartile - benchmark.metric_value).toLocaleString() :
                          'Leading'
                        }
                      </div>
                      <Progress 
                        value={(benchmark.metric_value / benchmark.top_quartile) * 100} 
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-6">
            {benchmarks
              .filter(b => b.percentile_rank < 75)
              .sort((a, b) => a.percentile_rank - b.percentile_rank)
              .map((benchmark) => (
                <Card key={benchmark.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{benchmark.metric_name}</CardTitle>
                      <Badge variant="outline">
                        Priority: {benchmark.percentile_rank < 25 ? 'High' : benchmark.percentile_rank < 50 ? 'Medium' : 'Low'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Current: {benchmark.metric_value.toLocaleString()} | 
                      Target: {benchmark.top_quartile.toLocaleString()} ({benchmark.percentile_rank}th percentile)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Improvement Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {benchmark.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm">
                          <Zap className="w-3 h-3 mr-1" />
                          Create Action Plan
                        </Button>
                        <Button size="sm" variant="outline">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ROI Analysis
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};