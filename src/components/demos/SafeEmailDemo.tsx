import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Link,
  FileText,
  Loader2
} from "lucide-react";

interface EmailAnalysis {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  threats: {
    phishing: boolean;
    malware: boolean;
    spam: boolean;
    spoofing: boolean;
  };
  details: {
    sender: string;
    subject: string;
    links: number;
    attachments: number;
    sentiment: string;
  };
  recommendations: string[];
}

const mockEmails = [
  {
    text: `From: security@paypal.com
Subject: Urgent: Verify Your Account Now
Dear Customer,
We've detected suspicious activity on your PayPal account. Please click the link below to verify your account immediately or it will be suspended within 24 hours.
Verify Now: https://paypal-security-verify.net/login
Thank you,
PayPal Security Team`,
    analysis: {
      overallRisk: 'critical' as const,
      riskScore: 95,
      threats: { phishing: true, malware: false, spam: true, spoofing: true },
      details: {
        sender: 'security@paypal.com (SPOOFED)',
        subject: 'Urgent: Verify Your Account Now',
        links: 1,
        attachments: 0,
        sentiment: 'Urgent/Threatening'
      },
      recommendations: [
        'Do not click any links in this email',
        'Report as phishing to your IT department',
        'Delete the email immediately',
        'Verify PayPal account status by logging in directly to official website'
      ]
    }
  },
  {
    text: `From: notifications@github.com
Subject: [GitHub] New repository invitation
Hi there,
You've been invited to collaborate on the repository "awesome-project" by john.doe.
View Invitation: https://github.com/invitations/abc123
Best regards,
GitHub Team`,
    analysis: {
      overallRisk: 'low' as const,
      riskScore: 15,
      threats: { phishing: false, malware: false, spam: false, spoofing: false },
      details: {
        sender: 'notifications@github.com (VERIFIED)',
        subject: '[GitHub] New repository invitation',
        links: 1,
        attachments: 0,
        sentiment: 'Professional/Neutral'
      },
      recommendations: [
        'Email appears legitimate',
        'Verify invitation by logging into GitHub directly',
        'Check if you recognize the repository name and sender'
      ]
    }
  }
];

export const SafeEmailDemo = () => {
  const [emailText, setEmailText] = useState('');
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeEmail = async () => {
    if (!emailText.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simple analysis based on keywords
    const text = emailText.toLowerCase();
    const isPhishing = text.includes('urgent') || text.includes('verify') || text.includes('suspended') || text.includes('click here');
    const hasLinks = text.includes('http') || text.includes('www.');
    const isSpam = text.includes('winner') || text.includes('lottery') || text.includes('congratulations');
    
    let riskScore = 10;
    if (isPhishing) riskScore += 40;
    if (hasLinks) riskScore += 20;
    if (isSpam) riskScore += 30;
    if (text.includes('paypal') && !text.includes('@paypal.com')) riskScore += 35;
    
    const riskLevel = riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low';
    
    setAnalysis({
      overallRisk: riskLevel,
      riskScore: Math.min(riskScore, 100),
      threats: {
        phishing: isPhishing,
        malware: text.includes('attachment') && isPhishing,
        spam: isSpam,
        spoofing: text.includes('paypal') || text.includes('bank')
      },
      details: {
        sender: emailText.includes('From:') ? emailText.split('From:')[1].split('\n')[0].trim() : 'Unknown',
        subject: emailText.includes('Subject:') ? emailText.split('Subject:')[1].split('\n')[0].trim() : 'No Subject',
        links: (emailText.match(/https?:\/\/[^\s]+/g) || []).length,
        attachments: 0,
        sentiment: isPhishing ? 'Urgent/Threatening' : 'Professional'
      },
      recommendations: riskLevel === 'critical' ? [
        'Do not click any links in this email',
        'Report as phishing to your IT department',
        'Delete the email immediately'
      ] : riskLevel === 'high' ? [
        'Exercise caution with this email',
        'Verify sender through alternative means',
        'Do not download attachments'
      ] : [
        'Email appears relatively safe',
        'Still verify sender if unexpected',
        'Use caution with any links or attachments'
      ]
    });
    
    setIsAnalyzing(false);
  };

  const loadSampleEmail = (index: number) => {
    setEmailText(mockEmails[index].text);
    setAnalysis(mockEmails[index].analysis);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ultrium SafeMail Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Analyze emails for phishing, malware, and security threats using AI-powered detection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Analysis
              </CardTitle>
              <CardDescription>
                Paste an email here to analyze it for security threats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sample Emails:</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleEmail(0)}
                  >
                    Phishing Email
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleEmail(1)}
                  >
                    Legitimate Email
                  </Button>
                </div>
              </div>
              
              <Textarea
                placeholder="Paste email content here..."
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              
              <Button 
                onClick={analyzeEmail}
                disabled={!emailText.trim() || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Email...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Analyze Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-8 text-muted-foreground">
                  Analyze an email to see detailed security assessment
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Risk Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Risk Score</span>
                      <Badge variant={getRiskBadgeVariant(analysis.overallRisk)}>
                        {analysis.overallRisk.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={analysis.riskScore} className="h-3" />
                    <p className={`text-sm mt-1 ${getRiskColor(analysis.overallRisk)}`}>
                      {analysis.riskScore}/100 Risk Level
                    </p>
                  </div>

                  {/* Threat Detection */}
                  <div>
                    <h4 className="font-medium mb-3">Threat Detection</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(analysis.threats).map(([threat, detected]) => (
                        <div key={threat} className="flex items-center gap-2">
                          {detected ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm capitalize">{threat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email Details */}
                  <div>
                    <h4 className="font-medium mb-3">Email Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Sender:</strong> {analysis.details.sender}</div>
                      <div><strong>Subject:</strong> {analysis.details.subject}</div>
                      <div><strong>Links:</strong> {analysis.details.links}</div>
                      <div><strong>Attachments:</strong> {analysis.details.attachments}</div>
                      <div><strong>Sentiment:</strong> {analysis.details.sentiment}</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-3">Recommendations</h4>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc pl-4 space-y-1">
                          {analysis.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm">{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};