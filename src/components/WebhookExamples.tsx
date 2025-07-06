import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Webhook, 
  Copy, 
  Play, 
  Settings, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Code,
  Zap,
  Server,
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebhookExample {
  id: string;
  title: string;
  description: string;
  language: string;
  category: 'server' | 'security' | 'compliance' | 'integration';
  code: string;
  events: string[];
}

const WebhookExamples = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('examples');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testWebhook, setTestWebhook] = useState({
    url: '',
    events: [] as string[],
    secret: '',
    testEvent: 'security.threat_detected'
  });

  const webhookExamples: WebhookExample[] = [
    {
      id: 'node-express',
      title: 'Node.js Express Handler',
      description: 'Basic webhook handler using Express.js',
      language: 'javascript',
      category: 'server',
      events: ['*'],
      code: `const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// Webhook signature verification
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-ultrium-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { event, data, timestamp } = req.body;
  
  console.log(\`Received webhook: \${event}\`, data);
  
  // Handle different event types
  switch (event) {
    case 'security.threat_detected':
      handleThreatDetected(data);
      break;
    case 'compliance.alert_triggered':
      handleComplianceAlert(data);
      break;
    default:
      console.log('Unknown event type:', event);
  }
  
  res.status(200).send('OK');
});

function handleThreatDetected(data) {
  // Send alert to security team
  console.log('SECURITY ALERT:', data);
  // Integrate with your alerting system
}

function handleComplianceAlert(data) {
  // Log compliance issue
  console.log('COMPLIANCE ISSUE:', data);
  // Create ticket in your system
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});`
    },
    {
      id: 'python-flask',
      title: 'Python Flask Handler',
      description: 'Webhook handler using Flask framework',
      language: 'python',
      category: 'server',
      events: ['*'],
      code: `from flask import Flask, request, jsonify
import hashlib
import hmac
import json
import os

app = Flask(__name__)

def verify_webhook_signature(payload, signature, secret):
    """Verify webhook signature"""
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Ultrium-Signature')
    payload = request.get_data()
    
    # Verify signature
    if not verify_webhook_signature(payload, signature, os.getenv('WEBHOOK_SECRET')):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    event = data.get('event')
    event_data = data.get('data')
    timestamp = data.get('timestamp')
    
    print(f"Received webhook: {event}", event_data)
    
    # Handle different events
    if event == 'security.threat_detected':
        handle_threat_detected(event_data)
    elif event == 'compliance.alert_triggered':
        handle_compliance_alert(event_data)
    else:
        print(f"Unknown event type: {event}")
    
    return jsonify({'status': 'success'}), 200

def handle_threat_detected(data):
    """Handle security threat detection"""
    print("SECURITY ALERT:", data)
    # Send notification to security team
    # Integrate with SIEM or alerting system

def handle_compliance_alert(data):
    """Handle compliance alerts"""
    print("COMPLIANCE ISSUE:", data)
    # Create compliance ticket
    # Send to compliance team

if __name__ == '__main__':
    app.run(debug=True, port=3000)`
    },
    {
      id: 'security-automation',
      title: 'Security Incident Automation',
      description: 'Automated security incident response system',
      language: 'javascript',
      category: 'security',
      events: ['security.threat_detected', 'security.scan_completed'],
      code: `const axios = require('axios');
const nodemailer = require('nodemailer');

class SecurityAutomation {
  constructor() {
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL;
    this.emailTransporter = nodemailer.createTransporter({
      // Your email configuration
    });
  }

  async handleThreatDetected(data) {
    const { threat_id, threat_type, severity, affected_resource } = data;
    
    console.log(\`🚨 Threat detected: \${threat_type} (\${severity})\`);
    
    // Auto-quarantine if critical
    if (severity === 'critical') {
      await this.quarantineResource(affected_resource);
    }
    
    // Send alerts
    await Promise.all([
      this.sendSlackAlert(data),
      this.sendEmailAlert(data),
      this.createIncidentTicket(data)
    ]);
  }

  async quarantineResource(resourceId) {
    try {
      // Call your system's quarantine API
      await axios.post('/api/quarantine', {
        resource_id: resourceId,
        reason: 'Automated threat response'
      });
      
      console.log(\`✅ Resource \${resourceId} quarantined\`);
    } catch (error) {
      console.error('Failed to quarantine resource:', error);
    }
  }

  async sendSlackAlert(data) {
    const message = {
      text: \`🚨 Security Alert: \${data.threat_type}\`,
      attachments: [{
        color: data.severity === 'critical' ? 'danger' : 'warning',
        fields: [
          { title: 'Threat Type', value: data.threat_type, short: true },
          { title: 'Severity', value: data.severity, short: true },
          { title: 'Resource', value: data.affected_resource, short: true },
          { title: 'Threat ID', value: data.threat_id, short: true }
        ]
      }]
    };
    
    await axios.post(this.slackWebhook, message);
  }

  async sendEmailAlert(data) {
    const mailOptions = {
      from: 'security@yourcompany.com',
      to: 'security-team@yourcompany.com',
      subject: \`🚨 Security Alert: \${data.threat_type}\`,
      html: \`
        <h2>Security Threat Detected</h2>
        <p><strong>Threat Type:</strong> \${data.threat_type}</p>
        <p><strong>Severity:</strong> \${data.severity}</p>
        <p><strong>Affected Resource:</strong> \${data.affected_resource}</p>
        <p><strong>Threat ID:</strong> \${data.threat_id}</p>
        <p><strong>Time:</strong> \${new Date().toISOString()}</p>
      \`
    };
    
    await this.emailTransporter.sendMail(mailOptions);
  }

  async createIncidentTicket(data) {
    // Integration with your ticketing system (Jira, ServiceNow, etc.)
    const ticket = {
      summary: \`Security Incident: \${data.threat_type}\`,
      description: \`Automated security incident created from threat detection.
        
Threat Details:
- Type: \${data.threat_type}
- Severity: \${data.severity}
- Resource: \${data.affected_resource}
- ID: \${data.threat_id}\`,
      priority: data.severity === 'critical' ? 'Highest' : 'High',
      assignee: 'security-team'
    };
    
    // Your ticketing system API call here
    console.log('Incident ticket created:', ticket);
  }
}

module.exports = SecurityAutomation;`
    },
    {
      id: 'compliance-reporter',
      title: 'Compliance Report Generator',
      description: 'Automated compliance reporting and documentation',
      language: 'python',
      category: 'compliance',
      events: ['compliance.alert_triggered', 'compliance.audit_completed'],
      code: `import sqlite3
import json
from datetime import datetime
from jinja2 import Template
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

class ComplianceReporter:
    def __init__(self):
        self.db_conn = sqlite3.connect('compliance.db')
        self.setup_database()
    
    def setup_database(self):
        """Create compliance tracking tables"""
        cursor = self.db_conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS compliance_events (
                id INTEGER PRIMARY KEY,
                event_type TEXT,
                framework TEXT,
                severity TEXT,
                description TEXT,
                timestamp TEXT,
                status TEXT DEFAULT 'open'
            )
        ''')
        self.db_conn.commit()
    
    def handle_compliance_alert(self, data):
        """Handle compliance alert webhook"""
        print(f"📋 Compliance alert: {data.get('framework')}")
        
        # Store in database
        self.store_compliance_event(data)
        
        # Generate immediate report if critical
        if data.get('severity') == 'critical':
            self.generate_immediate_report(data)
        
        # Check if this triggers any reporting thresholds
        self.check_reporting_thresholds(data.get('framework'))
    
    def store_compliance_event(self, data):
        """Store compliance event in database"""
        cursor = self.db_conn.cursor()
        cursor.execute('''
            INSERT INTO compliance_events 
            (event_type, framework, severity, description, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data.get('alert_type'),
            data.get('framework'),
            data.get('severity'),
            data.get('description'),
            datetime.now().isoformat()
        ))
        self.db_conn.commit()
    
    def generate_immediate_report(self, data):
        """Generate immediate report for critical issues"""
        report_template = Template('''
        <h2>🚨 Critical Compliance Alert</h2>
        <p><strong>Framework:</strong> {{ framework }}</p>
        <p><strong>Alert Type:</strong> {{ alert_type }}</p>
        <p><strong>Description:</strong> {{ description }}</p>
        <p><strong>Time:</strong> {{ timestamp }}</p>
        <p><strong>Recommended Action:</strong> {{ recommendation }}</p>
        ''')
        
        report_html = report_template.render(**data, timestamp=datetime.now())
        
        # Send to compliance team
        self.send_compliance_email(
            subject=f"🚨 Critical Compliance Alert: {data.get('framework')}",
            content=report_html
        )
    
    def check_reporting_thresholds(self, framework):
        """Check if we need to generate periodic reports"""
        cursor = self.db_conn.cursor()
        
        # Count recent events for this framework
        cursor.execute('''
            SELECT COUNT(*) FROM compliance_events 
            WHERE framework = ? AND date(timestamp) = date('now')
        ''', (framework,))
        
        daily_count = cursor.fetchone()[0]
        
        # Generate daily summary if > 5 events
        if daily_count > 5:
            self.generate_daily_summary(framework)
    
    def generate_daily_summary(self, framework):
        """Generate daily compliance summary"""
        cursor = self.db_conn.cursor()
        cursor.execute('''
            SELECT severity, COUNT(*) FROM compliance_events 
            WHERE framework = ? AND date(timestamp) = date('now')
            GROUP BY severity
        ''', (framework,))
        
        summary = dict(cursor.fetchall())
        
        report_template = Template('''
        <h2>📊 Daily Compliance Summary - {{ framework }}</h2>
        <p><strong>Date:</strong> {{ date }}</p>
        <h3>Event Summary:</h3>
        <ul>
        {% for severity, count in summary.items() %}
            <li>{{ severity|title }}: {{ count }} events</li>
        {% endfor %}
        </ul>
        <p>Please review the compliance dashboard for detailed information.</p>
        ''')
        
        report_html = report_template.render(
            framework=framework,
            date=datetime.now().strftime('%Y-%m-%d'),
            summary=summary
        )
        
        self.send_compliance_email(
            subject=f"📊 Daily Compliance Summary: {framework}",
            content=report_html
        )
    
    def send_compliance_email(self, subject, content):
        """Send compliance report via email"""
        msg = MIMEMultipart()
        msg['From'] = 'compliance@yourcompany.com'
        msg['To'] = 'compliance-team@yourcompany.com'
        msg['Subject'] = subject
        
        msg.attach(MIMEText(content, 'html'))
        
        # Your SMTP configuration
        print(f"📧 Compliance email sent: {subject}")

# Usage in webhook handler
compliance_reporter = ComplianceReporter()`
    },
    {
      id: 'msp-integration',
      title: 'MSP Client Integration',
      description: 'Multi-tenant webhook handler for MSP environments',
      language: 'javascript',
      category: 'integration',
      events: ['*'],
      code: `const express = require('express');
const { createClient } = require('@supabase/supabase-js');

class MSPWebhookHandler {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }

  async handleWebhook(req, res) {
    const { event, data, timestamp, client_id } = req.body;
    
    console.log(\`MSP Webhook: \${event} for client \${client_id || 'unknown'}\`);
    
    try {
      // Store event in client-specific log
      await this.logClientEvent(client_id, event, data, timestamp);
      
      // Route to appropriate handler
      switch (event) {
        case 'security.threat_detected':
          await this.handleClientThreat(client_id, data);
          break;
        case 'compliance.alert_triggered':
          await this.handleClientCompliance(client_id, data);
          break;
        case 'security.scan_completed':
          await this.handleScanComplete(client_id, data);
          break;
      }
      
      res.status(200).json({ status: 'processed' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Processing failed' });
    }
  }

  async logClientEvent(clientId, event, data, timestamp) {
    """Log event to client-specific table"""
    await this.supabase
      .from('client_security_events')
      .insert({
        client_id: clientId,
        event_type: event,
        event_data: data,
        timestamp: timestamp,
        processed_at: new Date().toISOString()
      });
  }

  async handleClientThreat(clientId, data) {
    """Handle security threat for specific client"""
    
    // Get client configuration
    const { data: clientConfig } = await this.supabase
      .from('msp_clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (!clientConfig) {
      console.error(\`Client \${clientId} not found\`);
      return;
    }
    
    // Apply client-specific security policies
    if (clientConfig.auto_quarantine && data.severity === 'critical') {
      await this.quarantineClientResource(clientId, data.affected_resource);
    }
    
    // Send client-specific notifications
    await this.notifyClientContacts(clientId, {
      type: 'security_threat',
      severity: data.severity,
      details: data
    });
    
    // Update client dashboard
    await this.updateClientDashboard(clientId, 'security_alert', data);
  }

  async handleClientCompliance(clientId, data) {
    """Handle compliance alert for specific client"""
    
    // Get client compliance requirements
    const { data: complianceReqs } = await this.supabase
      .from('client_compliance_requirements')
      .select('*')
      .eq('client_id', clientId);
    
    // Check if this affects any client requirements
    const affectedReqs = complianceReqs.filter(req => 
      req.framework === data.framework
    );
    
    if (affectedReqs.length > 0) {
      // Create compliance incident
      await this.createComplianceIncident(clientId, data, affectedReqs);
      
      // Schedule compliance review
      await this.scheduleComplianceReview(clientId, data.framework);
    }
  }

  async notifyClientContacts(clientId, notification) {
    """Send notifications to client contacts"""
    
    const { data: contacts } = await this.supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .eq('active', true);
    
    for (const contact of contacts) {
      // Send email notification
      await this.sendClientNotification(contact, notification);
      
      // Log notification
      await this.supabase
        .from('client_notifications')
        .insert({
          client_id: clientId,
          contact_id: contact.id,
          notification_type: notification.type,
          sent_at: new Date().toISOString()
        });
    }
  }

  async updateClientDashboard(clientId, updateType, data) {
    """Update client dashboard with real-time data"""
    
    // Update dashboard metrics
    await this.supabase
      .from('client_dashboard_metrics')
      .upsert({
        client_id: clientId,
        metric_type: updateType,
        metric_value: JSON.stringify(data),
        updated_at: new Date().toISOString()
      });
    
    // Trigger dashboard refresh via WebSocket
    // Your real-time notification system here
  }
}

// Express setup
const app = express();
app.use(express.json());

const mspHandler = new MSPWebhookHandler();

app.post('/msp-webhook', (req, res) => {
  mspHandler.handleWebhook(req, res);
});

app.listen(3000, () => {
  console.log('MSP Webhook handler running on port 3000');
});`
    }
  ];

  const availableEvents = [
    'security.threat_detected',
    'security.scan_completed',
    'compliance.alert_triggered',
    'compliance.audit_completed',
    'chat.message_received',
    'api.rate_limit_exceeded'
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const toggleEvent = (event: string) => {
    setTestWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const testWebhookEndpoint = () => {
    toast({
      title: "Test webhook sent!",
      description: "Check your webhook endpoint for the test payload",
    });
  };

  const filteredExamples = selectedCategory === 'all' 
    ? webhookExamples 
    : webhookExamples.filter(example => example.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Webhook className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Webhook Examples</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Real-world webhook implementations for security automation and integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
          <TabsTrigger value="setup">Webhook Setup</TabsTrigger>
          <TabsTrigger value="testing">Test Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="examples" className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Examples
            </Button>
            <Button
              variant={selectedCategory === 'server' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('server')}
            >
              <Server className="h-4 w-4 mr-1" />
              Server
            </Button>
            <Button
              variant={selectedCategory === 'security' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('security')}
            >
              <Shield className="h-4 w-4 mr-1" />
              Security
            </Button>
            <Button
              variant={selectedCategory === 'compliance' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('compliance')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Compliance
            </Button>
            <Button
              variant={selectedCategory === 'integration' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('integration')}
            >
              <Zap className="h-4 w-4 mr-1" />
              Integration
            </Button>
          </div>

          <div className="space-y-6">
            {filteredExamples.map((example) => (
              <Card key={example.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {example.category === 'server' && <Server className="h-5 w-5" />}
                        {example.category === 'security' && <Shield className="h-5 w-5" />}
                        {example.category === 'compliance' && <CheckCircle className="h-5 w-5" />}
                        {example.category === 'integration' && <Zap className="h-5 w-5" />}
                        {example.title}
                      </CardTitle>
                      <CardDescription>{example.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{example.language}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(example.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {example.events.map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                      <code>{example.code}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Set up webhooks to receive real-time notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={testWebhook.url}
                      onChange={(e) => setTestWebhook(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://your-server.com/webhook"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhookSecret">Webhook Secret</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      value={testWebhook.secret}
                      onChange={(e) => setTestWebhook(prev => ({ ...prev, secret: e.target.value }))}
                      placeholder="Enter a secure secret"
                    />
                  </div>

                  <Button className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Create Webhook
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label>Select Events</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableEvents.map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event}
                          checked={testWebhook.events.includes(event)}
                          onChange={() => toggleEvent(event)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={event} className="text-sm font-normal">
                          {event}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Webhook Security</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Signature Verification</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All webhooks include HMAC-SHA256 signatures for verification
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Retry Logic</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Failed webhooks are retried up to 3 times with exponential backoff
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Test Webhook
              </CardTitle>
              <CardDescription>Send test webhook payloads to your endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testUrl">Test Webhook URL</Label>
                  <Input
                    id="testUrl"
                    value={testWebhook.url}
                    onChange={(e) => setTestWebhook(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://your-server.com/webhook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testEvent">Test Event</Label>
                  <Select value={testWebhook.testEvent} onValueChange={(value) => setTestWebhook(prev => ({ ...prev, testEvent: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEvents.map((event) => (
                        <SelectItem key={event} value={event}>
                          {event}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Test Payload Preview</Label>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{JSON.stringify({
                      event: testWebhook.testEvent,
                      timestamp: new Date().toISOString(),
                      data: {
                        id: "test-" + Date.now(),
                        type: "test_event",
                        severity: "medium",
                        description: "This is a test webhook payload"
                      }
                    }, null, 2)}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => copyToClipboard(JSON.stringify({
                      event: testWebhook.testEvent,
                      timestamp: new Date().toISOString(),
                      data: {
                        id: "test-" + Date.now(),
                        type: "test_event",
                        severity: "medium",
                        description: "This is a test webhook payload"
                      }
                    }, null, 2))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Button onClick={testWebhookEndpoint} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Send Test Webhook
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Testing Tools</CardTitle>
              <CardDescription>External tools for webhook development and testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">ngrok</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Expose local servers to receive webhooks during development
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit ngrok
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Webhook.site</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Instantly get webhook URLs for testing and debugging
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit Webhook.site
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Postman</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Test webhook endpoints and validate request/response
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit Postman
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

export default WebhookExamples;