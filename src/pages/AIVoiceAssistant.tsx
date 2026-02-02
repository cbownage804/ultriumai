import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import AIVoiceAssistant from '@/components/voice/AIVoiceAssistant';

const AIVoiceAssistantPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="hover-scale"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/hub')}
                className="hover-scale"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Hub
              </Button>
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold">AI Security Assistant</h1>
              <p className="text-sm text-muted-foreground">Intelligent cybersecurity guidance</p>
            </div>

            <div className="w-32"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AIVoiceAssistant />
      </div>
    </div>
  );
};

export default AIVoiceAssistantPage;