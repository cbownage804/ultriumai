import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send,
  Bot,
  User,
  Building,
  Shield,
  Settings,
  Users,
  Loader2,
  Mic
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatScenario {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  messages: Message[];
}

const mockScenarios: ChatScenario[] = [
  {
    id: "help-desk",
    title: "Help Desk Automation",
    description: "Employee requesting password reset assistance",
    icon: Users,
    category: "IT Security",
    messages: [
      {
        id: "1",
        role: "user",
        content: "Hi, I'm locked out of my domain admin account and need urgent access to resolve a critical server issue. The primary DC is showing authentication errors and users can't log in.",
        timestamp: "10:30 AM"
      },
      {
        id: "2", 
        role: "assistant",
        content: "I understand this is a critical situation affecting domain authentication. Let me help you regain access safely while maintaining security protocols.\n\n**🚨 CRITICAL DOMAIN ISSUE - EMERGENCY RESPONSE**\n\n**📋 IMMEDIATE VERIFICATION REQUIRED:**\n1. **Identity Confirmation**:\n   - Employee ID and department\n   - Manager's name for emergency approval\n   - Last 4 digits of your badge number\n\n2. **Incident Validation**:\n   - Affected server name/IP\n   - Error codes observed\n   - Number of affected users\n\n**🔐 EMERGENCY ACCESS OPTIONS:**\n- **Option A**: Secondary admin account activation\n- **Option B**: Emergency break-glass account\n- **Option C**: Local server console access\n\n**⚠️ SECURITY MEASURES:**\n- All emergency access logged and monitored\n- Session recording enabled\n- 2-hour time limit with extension approval\n- Post-incident security review required\n\n**Current Domain Status**: 347 users affected, authentication services degraded\n\nPlease provide your employee ID so I can initiate emergency access procedures.",
        timestamp: "10:30 AM"
      },
      {
        id: "3",
        role: "user", 
        content: "My employee ID is IT-7841, I'm the Senior Systems Administrator, and my manager is David Chen. Badge number ends in 2847. The affected server is DC02 (192.168.1.10) with error 'The trust relationship between this workstation and the primary domain failed.'",
        timestamp: "10:31 AM"
      },
      {
        id: "4",
        role: "assistant",
        content: "**✅ IDENTITY VERIFIED & EMERGENCY ACCESS GRANTED**\n\n**👤 Confirmed**: Michael Torres, Senior Systems Administrator\n**📞 Manager Approval**: David Chen contacted and approved (Emergency Protocol 7)\n**🔓 Access Granted**: Break-glass account EMER-ADMIN-02\n\n**🔐 EMERGENCY CREDENTIALS:**\n- **Username**: `EMER-ADMIN-02@domain.local`\n- **Password**: `EmergDS2024!Temp` (expires in 2 hours)\n- **Session ID**: EMR-20240704-1031\n\n**📊 SYSTEM ANALYSIS:**\n✅ **Issue Identified**: Computer account password mismatch\n✅ **Root Cause**: DC02 missed automated password rotation\n✅ **Impact**: 347 users, 23 servers affected\n✅ **Resolution Steps**: Initiated computer account reset\n\n**🛠️ AUTOMATED REMEDIATION IN PROGRESS:**\n1. Computer account password reset ✅\n2. Kerberos ticket cache flush ✅\n3. Replication sync between DCs ✅\n4. Service restart sequence initiated...\n\n**📈 RECOVERY STATUS**: 89% complete\n**⏱️ ETA**: 3 minutes to full service restoration\n\n**📋 POST-INCIDENT ACTIONS QUEUED:**\n- Security incident ticket #SEC-2024-0342 created\n- Change management process initiated\n- Root cause analysis scheduled\n- Password rotation schedule review\n\nDomain services should be fully restored shortly. I'll continue monitoring and provide updates.",
        timestamp: "10:32 AM"
      }
    ]
  },
  {
    id: "security-incident",
    title: "Security Incident Response", 
    description: "Suspicious email reporting and threat analysis",
    icon: Shield,
    category: "Cybersecurity",
    messages: [
      {
        id: "1",
        role: "user",
        content: "I received a suspicious email claiming to be from our bank asking me to verify my account. It looks legitimate but something feels off. What should I do?",
        timestamp: "2:15 PM"
      },
      {
        id: "2",
        role: "assistant", 
        content: "Great instincts! You're absolutely right to be suspicious. Let me help you analyze this potential phishing attempt.\n\n**🚨 IMMEDIATE ACTIONS:**\n❌ **DO NOT** click any links in the email\n❌ **DO NOT** download any attachments\n❌ **DO NOT** provide any information\n\n**📋 ANALYSIS CHECKLIST:**\nCan you help me analyze this email? Please check:\n\n1. **Sender Analysis**:\n   - What's the exact sender email address?\n   - Does it match your bank's official domain?\n\n2. **Content Red Flags**:\n   - Does it create urgency (\"urgent action required\")?\n   - Generic greetings (\"Dear Customer\" vs your name)?\n   - Spelling/grammar errors?\n\n3. **Link Inspection**:\n   - Hover over links (don't click!) - where do they lead?\n   - Do URLs match the bank's official website?\n\nShare these details and I'll provide a full threat assessment!",
        timestamp: "2:16 PM"
      },
      {
        id: "3",
        role: "user",
        content: "The sender is 'security@chase-bankverify.com' and it says 'Dear Valued Customer' and wants me to verify within 24 hours or my account will be suspended. The link goes to chase-verification-center.net",
        timestamp: "2:18 PM"
      },
      {
        id: "4",
        role: "assistant",
        content: "🚨 **CONFIRMED PHISHING ATTEMPT** 🚨\n\nThis is definitely a malicious email. Here's my analysis:\n\n**🔍 THREAT INDICATORS:**\n❌ **Fake Domain**: `chase-bankverify.com` (real Chase uses `chase.com`)\n❌ **Malicious Link**: `chase-verification-center.net` (not legitimate)\n❌ **Generic Greeting**: \"Dear Valued Customer\" (banks use your name)\n❌ **Urgency Tactics**: 24-hour deadline pressure\n❌ **Account Suspension Threat**: Classic phishing technique\n\n**✅ IMMEDIATE ACTIONS TAKEN:**\n- Incident logged in security system (ID: SEC-2024-0341)\n- Threat intelligence updated\n- Email domain added to blocklist\n- IT Security team notified\n\n**🛡️ YOUR NEXT STEPS:**\n1. **Delete the email** immediately\n2. **Report to IT**: I've already logged this incident\n3. **Verify account directly**: Log into chase.com directly if concerned\n4. **Share with team**: Warning sent to all employees\n\n**🏆 EXCELLENT JOB!** You prevented a potential security breach by reporting this. Our security training is working!",
        timestamp: "2:19 PM"
      }
    ]
  },
  {
    id: "msp-client", 
    title: "MSP Client Support",
    description: "Multi-tenant client issue resolution",
    icon: Building,
    category: "MSP Operations",
    messages: [
      {
        id: "1",
        role: "user",
        content: "We're having network connectivity issues at our Austin office. The internet keeps dropping out every few hours. Can you check our systems?",
        timestamp: "3:45 PM"
      },
      {
        id: "2",
        role: "assistant",
        content: "I'll help you troubleshoot the network connectivity issues at your Austin office. Let me check your systems and provide a comprehensive analysis.\n\n**🔍 SYSTEM CHECK IN PROGRESS...**\n\n**📍 Client**: TechFlow Solutions - Austin Office\n**🏢 Location**: 123 Business Park Dr, Austin, TX\n**🌐 Circuit**: Fiber 100/100 Mbps (AT&T)\n**🔧 Equipment**: SonicWall TZ570, Cisco Switch, Ubiquiti APs\n\n**📊 CURRENT STATUS:**\n✅ **Primary Circuit**: Online (100/98 Mbps)\n⚠️ **DNS Response**: Intermittent delays detected\n🔴 **Firewall Logs**: 23 connection drops in last 6 hours\n⚠️ **DHCP Pool**: 87% utilized (warning threshold)\n\n**🔍 ANALYSIS:**\nI can see the pattern! The drops correlate with DHCP lease renewals. Your pool is nearly exhausted.\n\nShall I implement the fix remotely, or would you prefer a detailed explanation first?",
        timestamp: "3:46 PM"
      },
      {
        id: "3",
        role: "user",
        content: "Please go ahead and implement the fix remotely. We need this resolved ASAP as it's affecting our customer calls.",
        timestamp: "3:47 PM"
      },
      {
        id: "4",
        role: "assistant", 
        content: "**🔧 REMOTE RESOLUTION IN PROGRESS**\n\n**✅ ACTIONS COMPLETED:**\n\n1. **DHCP Pool Expansion**:\n   - Expanded from 192.168.1.100-150 → 192.168.1.100-200\n   - Lease time reduced from 24h → 8h for better turnover\n   - Reserved ranges updated for servers/printers\n\n2. **DNS Configuration**:\n   - Added backup DNS servers (1.1.1.1, 8.8.8.8)\n   - Configured DNS failover with 2-second timeout\n   - Cleared DNS cache on all devices\n\n3. **Firewall Optimization**:\n   - Updated connection timeout settings\n   - Enabled connection tracking optimization\n   - Added QoS priority for VoIP traffic\n\n**📈 IMMEDIATE RESULTS:**\n✅ Network stability restored\n✅ 47 devices successfully renewed leases\n✅ VoIP call quality improved\n✅ No drops detected in last 15 minutes\n\n**📋 TICKET CREATED**: #MSP-2024-0892\n- Priority: High (resolved)\n- Time to resolution: 12 minutes\n- Client notification sent\n- Monitoring enabled for 24h\n\n**🎯 Your network is stable!** I'll monitor for the next 24 hours and send a summary report.",
        timestamp: "3:48 PM"
      }
    ]
  },
  {
    id: "security-compliance",
    title: "Security Compliance & Audit",
    description: "IT admin requesting compliance checklist and audit preparation",
    icon: Settings,
    category: "Security Compliance",
    messages: [
      {
        id: "1",
        role: "user",
        content: "We have a SOC 2 Type II audit coming up next month. Can you help me prepare a security compliance checklist and identify any gaps in our current security posture?",
        timestamp: "9:15 AM"
      },
      {
        id: "2",
        role: "assistant",
        content: "Absolutely! I'll help you prepare for your SOC 2 Type II audit. Let me generate a comprehensive compliance checklist and review your current security controls.\n\n**🔍 SOC 2 TYPE II AUDIT PREPARATION**\n\n**📋 TRUST SERVICES CRITERIA CHECKLIST:**\n\n**🔒 SECURITY (CC6):**\n✅ **Access Controls**:\n   - Multi-factor authentication implemented\n   - Role-based access control (RBAC) configured\n   - Privileged access management (PAM) in place\n   - Regular access reviews documented\n\n✅ **Network Security**:\n   - Firewall rules documented and reviewed\n   - Network segmentation implemented\n   - VPN access controls configured\n   - Intrusion detection/prevention systems active\n\n⚠️ **Vulnerability Management**:\n   - Quarterly vulnerability scans completed\n   - Patch management process documented\n   - Critical vulnerabilities remediated within 30 days\n   - Penetration testing conducted annually\n\n**📊 CURRENT GAPS IDENTIFIED:**\n🔴 **High Priority**:\n   - Incident response plan needs annual review (last updated 18 months ago)\n   - Backup restoration testing overdue (last test 8 months ago)\n   - Security awareness training completion at 78% (target: 95%)\n\n🟡 **Medium Priority**:\n   - Data classification policy implementation\n   - Vendor risk assessment updates\n   - Security metrics reporting automation\n\nWould you like me to detail the remediation steps for the high-priority gaps?",
        timestamp: "9:16 AM"
      },
      {
        id: "3",
        role: "user",
        content: "Yes, please provide the remediation steps for the high-priority gaps. Also, what documentation will the auditors expect to see?",
        timestamp: "9:18 AM"
      },
      {
        id: "4",
        role: "assistant",
        content: "**🚨 HIGH-PRIORITY REMEDIATION PLAN:**\n\n**1️⃣ INCIDENT RESPONSE PLAN UPDATE**\n**Timeline**: 1 week\n**Actions Required**:\n✅ Review current IRP against NIST 800-61 framework\n✅ Update contact lists and escalation procedures\n✅ Add new threat vectors (cloud, remote work, supply chain)\n✅ Conduct tabletop exercise with key stakeholders\n✅ Document lessons learned and plan updates\n\n**2️⃣ BACKUP RESTORATION TESTING**\n**Timeline**: 2 weeks\n**Actions Required**:\n✅ Schedule quarterly restoration tests for critical systems\n✅ Test both file-level and full system restoration\n✅ Verify RTO/RPO objectives are met\n✅ Document test results and any issues found\n✅ Update backup procedures based on findings\n\n**3️⃣ SECURITY AWARENESS TRAINING**\n**Timeline**: 3 weeks\n**Actions Required**:\n✅ Identify 22% of staff who haven't completed training\n✅ Send automated reminders with deadline\n✅ Schedule make-up sessions for non-completers\n✅ Implement phishing simulation testing\n✅ Track completion rates in real-time dashboard\n\n**📋 REQUIRED AUDIT DOCUMENTATION:**\n\n**Security Policies & Procedures**:\n• Information Security Policy (updated annually)\n• Access Control Procedures\n• Incident Response Plan\n• Data Classification & Handling Procedures\n• Vendor Management Policy\n\n**Evidence of Implementation**:\n• Access review logs (quarterly)\n• Security training completion records\n• Vulnerability scan reports (quarterly)\n• Penetration test results (annual)\n• Backup test results (quarterly)\n• Security incident logs and responses\n\n**Monitoring & Metrics**:\n• Security dashboard screenshots\n• SIEM alert summaries\n• Compliance metrics reports\n• Risk assessment documentation\n\nI can help you generate templates for any missing documentation. Which would you like me to prioritize?",
        timestamp: "9:19 AM"
      }
    ]
  }
];

export const UltriumGPTDemo = () => {
  const [selectedScenario, setSelectedScenario] = useState<ChatScenario | null>(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadScenario = (scenario: ChatScenario) => {
    setSelectedScenario(scenario);
    setMessages(scenario.messages);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setCurrentMessage("");
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Thanks for your question! This is a demo environment showcasing UltriumGPT's capabilities. In a real deployment, I would provide intelligent, context-aware responses based on your company's specific policies, procedures, and integrations.\n\nKey capabilities I would offer:\n• Access to your company knowledge base\n• Integration with your IT systems\n• Personalized responses based on your role\n• Automated workflow triggers\n• Security-compliant interactions\n\nTo see UltriumGPT in action with real data, schedule a personalized demo with our team!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const resetChat = () => {
    setMessages([]);
    setSelectedScenario(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">UltriumGPT Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Experience intelligent business automation with AI agents trained on your specific workflows
          </p>
          <div className="mt-4">
            <Button 
              onClick={() => window.location.href = '/ultrium-gpt?tab=voice'}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Mic className="h-4 w-4 mr-2" />
              Try Full Voice Interface in Ultrium GPT
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Demo Scenarios
              </CardTitle>
              <CardDescription>
                Choose a business scenario to see UltriumGPT in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockScenarios.map((scenario) => {
                const Icon = scenario.icon;
                return (
                  <Button
                    key={scenario.id}
                    variant={selectedScenario?.id === scenario.id ? "default" : "outline"}
                    onClick={() => loadScenario(scenario)}
                    className="w-full justify-start text-left h-auto p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{scenario.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {scenario.description}
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {scenario.category}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                );
              })}
              
              <Button 
                variant="ghost" 
                onClick={resetChat}
                className="w-full"
              >
                Start Fresh Chat
              </Button>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {selectedScenario ? selectedScenario.title : "UltriumGPT Chat"}
                  </CardTitle>
                  {selectedScenario && (
                    <Badge variant="outline" className="mt-1">
                      {selectedScenario.category}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Online
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <ScrollArea className="h-96 border rounded-lg p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a demo scenario or start a fresh chat</p>
                      <p className="text-sm mt-2">UltriumGPT is ready to assist with your business needs</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.role === 'user' ? 'bg-primary' : 'bg-muted'
                          }`}>
                            {message.role === 'user' ? (
                              <User className="h-4 w-4 text-white" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                              message.role === 'user' 
                                ? 'bg-primary text-white' 
                                : 'bg-muted'
                            }`}>
                              <div className="whitespace-pre-wrap text-sm">
                                {message.content}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {message.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="inline-block p-3 rounded-lg bg-muted">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask UltriumGPT anything about your business..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isTyping}
                    size="icon"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};