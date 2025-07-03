import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatDemo = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI knowledge assistant. Ask me anything about your company's policies, procedures, or documentation.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const predefinedResponses: Record<string, string> = {
    "onboard": "To onboard a new user:\n\n1. Create their account in Active Directory\n2. Assign appropriate security groups\n3. Set up their workstation with standard software\n4. Schedule orientation meeting\n5. Send welcome package with company handbook\n\nThis process typically takes 2-3 business days. Would you like details on any specific step?",
    "password": "For password reset procedures:\n\n1. Verify user identity\n2. Navigate to Admin Panel > User Management\n3. Select the user and click 'Reset Password'\n4. Generate temporary password\n5. Send secure credentials via approved channel\n\nPassword must meet complexity requirements: 12+ characters, mixed case, numbers, and symbols.",
    "expense": "To submit expense reports:\n\n1. Log into ExpenseTracker portal\n2. Create new report for the appropriate month\n3. Upload receipts (PDF/JPG format)\n4. Categorize each expense\n5. Submit for manager approval\n\nReports must be submitted by the 5th of each month. Maximum per-meal allowance is $50 without prior approval.",
    "default": "I found relevant information in your knowledge base. Here are the key points:\n\n• Check the company handbook section 4.2\n• Review the standard operating procedures\n• Contact your manager for specific approvals\n\nWould you like me to search for more specific information on this topic?"
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let response = predefinedResponses.default;
      
      if (lowerInput.includes('onboard') || lowerInput.includes('new user')) {
        response = predefinedResponses.onboard;
      } else if (lowerInput.includes('password') || lowerInput.includes('reset')) {
        response = predefinedResponses.password;
      } else if (lowerInput.includes('expense') || lowerInput.includes('report')) {
        response = predefinedResponses.expense;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[80%] ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-user-message text-user-message-foreground' 
                    : 'bg-ai-message text-ai-message-foreground'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    message.sender === 'user'
                      ? 'bg-user-message text-user-message-foreground'
                      : 'bg-ai-message text-ai-message-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ai-message text-ai-message-foreground flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-ai-message text-ai-message-foreground rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about policies, procedures, or documentation..."
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatDemo;