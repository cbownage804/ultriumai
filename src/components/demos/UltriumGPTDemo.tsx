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
  Loader2
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
    category: "IT Support",
    messages: [
      {
        id: "1",
        role: "user",
        content: "Hi, I'm locked out of my email account and need to reset my password. Can you help?",
        timestamp: "10:30 AM"
      },
      {
        id: "2", 
        role: "assistant",
        content: "I can definitely help you with that password reset! Let me walk you through our secure process:\n\n1. **Identity Verification**: I'll need to verify your identity first\n   - What's your employee ID?\n   - What department do you work in?\n\n2. **Password Reset Options**:\n   - Self-service portal reset\n   - IT admin assisted reset\n   - Temporary password generation\n\n3. **Security Requirements**:\n   - New password must be 12+ characters\n   - Include uppercase, lowercase, numbers, and symbols\n   - Cannot reuse last 12 passwords\n\nCould you provide your employee ID to get started?",
        timestamp: "10:30 AM"
      },
      {
        id: "3",
        role: "user", 
        content: "My employee ID is EMP-4521 and I work in the Marketing department.",
        timestamp: "10:31 AM"
      },
      {
        id: "4",
        role: "assistant",
        content: "Perfect! I've verified your identity in our system. I can see you're Sarah Johnson from the Marketing department.\n\n**Password Reset Process:**\n\n✅ **Identity Verified**\n📧 **Account Found**: sarah.johnson@company.com\n🔒 **Security Check**: No recent failed login attempts\n\n**Next Steps:**\n1. I'm generating a secure temporary password\n2. You'll receive an email with reset instructions\n3. You'll be required to change the password on first login\n\n**Temporary Password**: `TempSecure2024!`\n\nPlease check your personal email (ending in gmail.com) for the reset link. The temporary password expires in 24 hours.\n\n**Need anything else?** I can also help with:\n- Setting up 2FA\n- Password manager recommendations\n- Security best practices",
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
    id: "policy-guidance",
    title: "Policy & Procedure Guidance",
    description: "Employee asking about company policies",
    icon: Settings,
    category: "HR & Compliance", 
    messages: [
      {
        id: "1",
        role: "user",
        content: "What's our policy on working from home? I'd like to work remotely 2 days a week but want to make sure I follow the correct process.",
        timestamp: "9:15 AM"
      },
      {
        id: "2",
        role: "assistant",
        content: "I'd be happy to help you understand our remote work policy! Let me pull up the current guidelines for you.\n\n**🏠 REMOTE WORK POLICY SUMMARY:**\n\n**📋 ELIGIBILITY:**\n✅ Employees with 90+ days tenure\n✅ Satisfactory performance reviews\n✅ Role suitable for remote work\n✅ Manager approval required\n\n**📅 FREQUENCY OPTIONS:**\n- **Hybrid**: 1-3 days per week (most common)\n- **Full Remote**: 4-5 days per week (special approval)\n- **Occasional**: As-needed basis\n\n**📝 APPROVAL PROCESS:**\n1. **Submit Request**: Use HR portal or email manager\n2. **Manager Review**: 5 business day response\n3. **HR Approval**: For 3+ days per week\n4. **IT Setup**: Equipment and security setup\n5. **Trial Period**: 30-day evaluation\n\n**💻 REQUIREMENTS:**\n- Secure home office setup\n- Reliable internet (25+ Mbps)\n- Company laptop with VPN\n- Compliance with security policies\n\nWould you like me to help you start the request process?",
        timestamp: "9:16 AM"
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