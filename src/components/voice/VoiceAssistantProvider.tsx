import { createContext, useContext, useState, ReactNode } from 'react';

interface VoiceAssistantContextType {
  isAssistantEnabled: boolean;
  setIsAssistantEnabled: (enabled: boolean) => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined);

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (context === undefined) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
};

interface VoiceAssistantProviderProps {
  children: ReactNode;
}

export const VoiceAssistantProvider = ({ children }: VoiceAssistantProviderProps) => {
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(true);

  return (
    <VoiceAssistantContext.Provider value={{ 
      isAssistantEnabled, 
      setIsAssistantEnabled 
    }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};