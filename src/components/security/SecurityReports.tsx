import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Share, Calendar, TrendingUp, AlertTriangle, Shield, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecurityScan {
  id: string;
  target: string;
  scan_type: string;
  status: string;
  findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  started_at: string;
  completed_at?: string;
}

interface SecurityReportsProps {
  scans: SecurityScan[];
}

export const SecurityReports = ({ scans }: SecurityReportsProps) => {
  const [selectedReport, setSelectedReport] = useState("executive");
  const [timeRange, setTimeRange] = useState("30d");
  const { toast } = useToast();

  const generateReport = (type: string) => {
    toast({
      title: "Report Generated",
      description: `${type} report has been generated and is ready for download`,
    });
  };

  const exportReport = (format: string) => {
    toast({
      title: "Export Started",
      description: `Report is being exported in ${format.toUpperCase()} format`,
    });
  };

  const totalScans = scans.length;
  const totalFindings = scans.reduce((sum, scan) => sum + scan.findings_count, 0);
  const criticalFindings = scans.reduce((sum, scan) => sum + scan.critical_count, 0);
  const highFindings = scans.reduce((sum, scan) => sum + scan.high_count, 0);

  const riskScore = totalFindings > 0 ? Math.round(((criticalFindings * 4 + highFindings * 3) / totalFindings) * 25) : 0;
  const trendDirection = Math.random() > 0.5 ? 'up' : 'down';
  const trendValue = Math.floor(Math.random() * 20) + 5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Security Reports</h2>
            <p className="text-muted-foreground">Comprehensive security analytics and reporting</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList>
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
          <TabsTrigger value="technical">Technical Report</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Report</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{totalScans}</div>
                <p className="text-sm text-muted-foreground">Security Assessments</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendingUp className={`h-3 w-3 ${trendDirection === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-xs text-muted-foreground">{trendValue}% vs last period</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{criticalFindings}</div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
                <Badge variant="destructive" className="mt-1 text-xs">Immediate Action Required</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{riskScore}</div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <Badge variant={riskScore > 70 ? "destructive" : riskScore > 40 ? "secondary" : "default"} className="mt-1 text-xs">
                  {riskScore > 70 ? "High Risk" : riskScore > 40 ? "Medium Risk" : "Low Risk"}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {Math.round((scans.filter(s => s.status === 'completed').length / totalScans) * 100) || 0}%
                </div>
                <p className="text-sm text-muted-foreground">Scan Success Rate</p>
                <div className="text-xs text-green-600 mt-1">Excellent Performance</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>High-level security posture overview for leadership</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Security Assessment Overview</h3>
                <p>
                  Over the past {timeRange === '30d' ? '30 days' : timeRange}, our security operations team conducted {totalScans} comprehensive security assessments across our digital infrastructure. These assessments identified a total of {totalFindings} security findings, with {criticalFindings} classified as critical and requiring immediate remediation.
                </p>
                
                <h3>Key Findings</h3>
                <ul>
                  <li><strong>Critical Vulnerabilities:</strong> {criticalFindings} issues requiring immediate attention</li>
                  <li><strong>High Priority Items:</strong> {highFindings} vulnerabilities with significant impact potential</li>
                  <li><strong>Overall Risk Score:</strong> {riskScore}/100 ({riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low'} risk level)</li>
                  <li><strong>Scan Coverage:</strong> 100% of identified assets assessed</li>
                </ul>
                
                <h3>Recommendations</h3>
                <ul>
                  <li>Prioritize remediation of all critical vulnerabilities within 48 hours</li>
                  <li>Implement additional monitoring for high-risk assets</li>
                  <li>Enhance security awareness training for development teams</li>
                  <li>Consider third-party security validation for critical systems</li>
                </ul>
                
                <h3>Business Impact</h3>
                <p>
                  The current security posture represents a {riskScore > 70 ? 'significant' : riskScore > 40 ? 'moderate' : 'minimal'} risk to business operations. Immediate action on critical findings will reduce exposure and maintain customer trust.
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => generateReport("Executive Summary")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Full Report
                </Button>
                <Button variant="outline" onClick={() => exportReport("pdf")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={() => exportReport("powerpoint")}>
                  <Share className="mr-2 h-4 w-4" />
                  Export Presentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Security Report</CardTitle>
              <CardDescription>Detailed technical findings and remediation guidance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Vulnerability Breakdown by Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-5 w-5 text-red-500" />
                          <h4 className="font-medium">Web Application</h4>
                        </div>
                        <div className="text-2xl font-bold">{Math.floor(totalFindings * 0.4)}</div>
                        <p className="text-sm text-muted-foreground">XSS, SQL Injection, CSRF</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-orange-500" />
                          <h4 className="font-medium">Network Security</h4>
                        </div>
                        <div className="text-2xl font-bold">{Math.floor(totalFindings * 0.3)}</div>
                        <p className="text-sm text-muted-foreground">Open ports, SSL/TLS issues</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <h4 className="font-medium">Configuration</h4>
                        </div>
                        <div className="text-2xl font-bold">{Math.floor(totalFindings * 0.3)}</div>
                        <p className="text-sm text-muted-foreground">Misconfigurations, defaults</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Scan Results</h3>
                  <div className="space-y-3">
                    {scans.slice(0, 5).map((scan) => (
                      <div key={scan.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{scan.target}</h4>
                            <p className="text-sm text-muted-foreground">
                              {scan.scan_type} scan • {new Date(scan.started_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={scan.status === 'completed' ? 'default' : 'secondary'}>
                            {scan.status}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-4 text-sm">
                          <span className="text-red-500">{scan.critical_count} Critical</span>
                          <span className="text-orange-500">{scan.high_count} High</span>
                          <span className="text-yellow-500">{scan.medium_count} Medium</span>
                          <span className="text-blue-500">{scan.low_count} Low</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => generateReport("Technical Report")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Technical Report
                  </Button>
                  <Button variant="outline" onClick={() => exportReport("csv")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status Report</CardTitle>
              <CardDescription>Regulatory compliance and industry standards assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Compliance Standards</h3>
                    
                    <div className="space-y-3">
                      {[
                        { name: 'OWASP Top 10', score: 85, status: 'compliant' },
                        { name: 'NIST Framework', score: 78, status: 'mostly' },
                        { name: 'ISO 27001', score: 92, status: 'compliant' },
                        { name: 'PCI DSS', score: 68, status: 'non-compliant' },
                      ].map((standard) => (
                        <div key={standard.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{standard.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${standard.score}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground">{standard.score}%</span>
                            </div>
                          </div>
                          <Badge variant={
                            standard.status === 'compliant' ? 'default' : 
                            standard.status === 'mostly' ? 'secondary' : 'destructive'
                          }>
                            {standard.status === 'compliant' ? 'Compliant' :
                             standard.status === 'mostly' ? 'Mostly Compliant' : 'Non-Compliant'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Compliance Actions</h3>
                    
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <h4 className="font-medium text-sm">PCI DSS Remediation</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Address payment card data encryption requirements
                        </p>
                        <Badge variant="destructive" className="mt-1 text-xs">Due in 14 days</Badge>
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <h4 className="font-medium text-sm">Annual Assessment</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ISO 27001 annual compliance review scheduled
                        </p>
                        <Badge variant="secondary" className="mt-1 text-xs">Next month</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => generateReport("Compliance Report")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Compliance Report
                  </Button>
                  <Button variant="outline" onClick={() => exportReport("audit")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export for Auditors
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Trends & Analytics</CardTitle>
              <CardDescription>Historical data and trend analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Threat Trends</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Web Application Attacks</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-500">+23%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Phishing Attempts</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
                          <span className="text-sm text-green-500">-15%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Malware Detections</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
                          <span className="text-sm text-green-500">-8%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Response Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Mean Time to Detection</span>
                        <span className="text-sm font-medium">2.3 hours</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Mean Time to Response</span>
                        <span className="text-sm font-medium">4.7 hours</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Resolution Rate</span>
                        <span className="text-sm font-medium">94.2%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Monthly Security Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {['Jan', 'Feb', 'Mar', 'Apr'].map((month, index) => (
                      <div key={month} className="text-center p-4 border rounded-lg">
                        <div className="text-lg font-bold">{month}</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.floor(Math.random() * 50) + 20} incidents
                        </div>
                        <div className="text-xs text-green-500 mt-1">
                          -{Math.floor(Math.random() * 10) + 5}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => generateReport("Trends Report")}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Generate Trends Report
                  </Button>
                  <Button variant="outline" onClick={() => exportReport("analytics")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};