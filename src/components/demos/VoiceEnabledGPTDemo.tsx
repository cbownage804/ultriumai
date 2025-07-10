import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GPTVoiceControls } from '@/components/voice/GPTVoiceControls';
import { 
  Volume2, 
  Bot, 
  Sparkles, 
  Mic,
  MessageSquare,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export const VoiceEnabledGPTDemo = () => {
  const [demoStep, setDemoStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demoSteps = [
    {
      title: "Enable Voice",
      description: "Turn on voice capabilities for your GPT",
      icon: <Volume2 className="h-6 w-6" />,
      completed: demoStep > 0
    },
    {
      title: "Configure Voice",
      description: "Choose voice character and settings",
      icon: <Bot className="h-6 w-6" />,
      completed: demoStep > 1
    },
    {
      title: "Test Voice Response",
      description: "Hear your GPT speak responses",
      icon: <MessageSquare className="h-6 w-6" />,
      completed: demoStep > 2
    },
    {
      title: "Voice Input",
      description: "Talk to your GPT using voice commands",
      icon: <Mic className="h-6 w-6" />,
      completed: demoStep > 3
    }
  ];

  const features = [
    {
      title: "ElevenLabs Integration",
      description: "High-quality voice synthesis with multiple character options",
      icon: <Sparkles className="h-5 w-5 text-yellow-500" />
    },
    {
      title: "Customer API Keys",
      description: "Let customers use their own ElevenLabs API for unlimited usage",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    },
    {
      title: "Voice Recognition",
      description: "Support for voice input and commands (coming soon)",
      icon: <Mic className="h-5 w-5 text-blue-500" />
    },
    {
      title: "Auto-Speak Responses",
      description: "Automatically read AI responses aloud for hands-free interaction",
      icon: <Volume2 className="h-5 w-5 text-purple-500" />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Voice-Enabled Custom GPTs
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Transform your custom GPTs with voice capabilities. Let your AI assistants speak responses and interact through voice commands using ElevenLabs technology.
        </p>
      </div>

      {/* Demo Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Interactive Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Steps */}
            <div className="space-y-4">
              {demoSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${step.completed ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {step.completed ? <CheckCircle className="h-4 w-4" /> : step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index === demoStep && (
                    <Button
                      onClick={() => setDemoStep(prev => Math.min(prev + 1, demoSteps.length))}
                      size="sm"
                      variant="outline"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Live Demo */}
            <div className="space-y-4">
              <h3 className="font-medium">Try It Now</h3>
              <GPTVoiceControls 
                showSettings={true}
                className="p-4 border rounded-lg bg-muted/30"
              />
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 This demo uses the default voice settings. In your custom GPT, users can configure their own voice preferences and API keys.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <div className="mb-4 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Badge variant="outline" className="mb-2">Step 1</Badge>
              <h4 className="font-medium">Configure Voice Settings</h4>
              <p className="text-sm text-muted-foreground">
                In your GPT personalization settings, enable voice and choose your preferred voice character, speech rate, and auto-speak options.
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="mb-2">Step 2</Badge>
              <h4 className="font-medium">Set API Key Option</h4>
              <p className="text-sm text-muted-foreground">
                Choose whether to use the system ElevenLabs key or allow customers to provide their own API key for unlimited usage.
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="mb-2">Step 3</Badge>
              <h4 className="font-medium">Deploy & Test</h4>
              <p className="text-sm text-muted-foreground">
                Save your settings and test the voice functionality. Your GPT will now speak responses and support voice interactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};