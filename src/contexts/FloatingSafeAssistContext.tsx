/**
 * Context for managing the FloatingSafeAssist widget state
 * Allows opening the assistant from navigation without navigating to the full page
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FloatingSafeAssistContextType {
  isOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
}

const FloatingSafeAssistContext = createContext<FloatingSafeAssistContextType | null>(null);

export function FloatingSafeAssistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAssistant = useCallback(() => setIsOpen(true), []);
  const closeAssistant = useCallback(() => setIsOpen(false), []);
  const toggleAssistant = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <FloatingSafeAssistContext.Provider value={{ isOpen, openAssistant, closeAssistant, toggleAssistant }}>
      {children}
    </FloatingSafeAssistContext.Provider>
  );
}

export function useFloatingSafeAssist() {
  const context = useContext(FloatingSafeAssistContext);
  if (!context) {
    throw new Error('useFloatingSafeAssist must be used within FloatingSafeAssistProvider');
  }
  return context;
}
