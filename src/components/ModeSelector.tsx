import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Brain, 
  Shield, 
  Code, 
  PenTool, 
  Briefcase,
  Lightbulb,
  Cpu
} from 'lucide-react';

export interface AIMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  systemPrompt: string;
  features: string[];
}

const AI_MODES: AIMode[] = [
  {
    id: 'general',
    name: 'General Assistant',
    description: 'Open-ended conversations and general help',
    icon: <MessageCircle className="h-5 w-5" />,
    color: 'bg-blue-500',
    systemPrompt: 'You are a helpful AI assistant. Provide accurate, helpful, and engaging responses to any questions or topics.',
    features: ['Any topic', 'Creative writing', 'Q&A', 'Brainstorming']
  },
  {
    id: 'business',
    name: 'Business Intelligence',
    description: 'Data analysis, strategy, and business insights',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'bg-emerald-500',
    systemPrompt: 'You are a business intelligence AI specialist. Focus on data analysis, business strategy, market insights, and helping with business decisions. Provide actionable recommendations.',
    features: ['Data analysis', 'Strategy planning', 'Market research', 'KPI optimization']
  },
  {
    id: 'security',
    name: 'Security Analyst',
    description: 'Cybersecurity analysis and threat assessment',
    icon: <Shield className="h-5 w-5" />,
    color: 'bg-red-500',
    systemPrompt: 'You are a cybersecurity expert AI. Analyze security threats, provide security recommendations, help with incident response, and explain security concepts clearly.',
    features: ['Threat analysis', 'Incident response', 'Security audits', 'Risk assessment']
  },
  {
    id: 'developer',
    name: 'Developer Assistant',
    description: 'Code review, debugging, and development help',
    icon: <Code className="h-5 w-5" />,
    color: 'bg-purple-500',
    systemPrompt: 'You are a senior software engineer AI. Help with code review, debugging, architecture decisions, and best practices. Provide clean, efficient code solutions.',
    features: ['Code review', 'Debugging', 'Architecture', 'Best practices']
  },
  {
    id: 'creative',
    name: 'Creative Studio',
    description: 'Content creation, design, and marketing',
    icon: <PenTool className="h-5 w-5" />,
    color: 'bg-pink-500',
    systemPrompt: 'You are a creative AI specialist. Help with content creation, copywriting, design concepts, marketing strategies, and creative problem-solving.',
    features: ['Content writing', 'Design ideas', 'Marketing copy', 'Creative concepts']
  },
  {
    id: 'research',
    name: 'Research Assistant',
    description: 'Deep analysis, research, and insights',
    icon: <Brain className="h-5 w-5" />,
    color: 'bg-indigo-500',
    systemPrompt: 'You are a research AI specialist. Conduct thorough analysis, provide detailed research insights, synthesize information from multiple perspectives, and present findings clearly.',
    features: ['Deep research', 'Data synthesis', 'Report writing', 'Fact checking']
  }
];

interface ModeSelectorProps {
  selectedMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  className?: string;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ 
  selectedMode, 
  onModeChange, 
  className 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Mode</h3>
        <Badge variant="outline" className="ml-auto">
          {selectedMode.name}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_MODES.map((mode) => (
          <Card 
            key={mode.id}
            className={`cursor-pointer transition-all hover:scale-105 ${
              selectedMode.id === mode.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => onModeChange(mode)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${mode.color} text-white`}>
                  {mode.icon}
                </div>
                {selectedMode.id === mode.id && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base">{mode.name}</CardTitle>
              <CardDescription className="text-xs">
                {mode.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1">
                {mode.features.slice(0, 2).map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {mode.features.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{mode.features.length - 2}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Selected Mode Details */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedMode.color} text-white`}>
              {selectedMode.icon}
            </div>
            <div>
              <CardTitle className="text-base">{selectedMode.name}</CardTitle>
              <CardDescription className="text-sm">
                {selectedMode.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">Specialized Features:</h4>
              <div className="flex flex-wrap gap-1">
                {selectedMode.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { AI_MODES };