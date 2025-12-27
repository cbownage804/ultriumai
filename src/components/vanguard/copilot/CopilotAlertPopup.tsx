import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, X, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface CopilotAlertPopupProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  onDismissAll: () => void;
}

export function CopilotAlertPopup({ alerts, onDismiss, onDismissAll }: CopilotAlertPopupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };
  
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-[hsl(var(--threat-critical))] text-white';
      case 'warning':
        return 'bg-[hsl(var(--threat-high))] text-black';
      default:
        return 'bg-[hsl(var(--copilot-accent))] text-black';
    }
  };
  
  const getBorderColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-[hsl(var(--threat-critical)/0.5)]';
      case 'warning':
        return 'border-[hsl(var(--threat-high)/0.5)]';
      default:
        return 'border-[hsl(var(--copilot-accent)/0.5)]';
    }
  };

  if (alerts.length === 0) return null;

  const latestAlert = alerts[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="absolute top-full left-0 right-0 mt-2 z-50"
      >
        <div className={cn(
          "rounded-lg border overflow-hidden",
          "bg-[hsl(var(--copilot-bg))]",
          getBorderColor(latestAlert.type),
          "shadow-xl shadow-black/30"
        )}>
          {/* Alert Header */}
          <motion.div
            className={cn(
              "px-4 py-3 flex items-center justify-between cursor-pointer",
              getAlertColor(latestAlert.type)
            )}
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                {getAlertIcon(latestAlert.type)}
              </motion.div>
              <div>
                <p className="font-semibold text-sm">{latestAlert.title}</p>
                <p className="text-xs opacity-80">
                  {alerts.length > 1 ? `+${alerts.length - 1} more alerts` : 'Just now'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissAll();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
          
          {/* Expanded Alert List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="max-h-64 overflow-y-auto">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "px-4 py-3 border-b border-[hsl(var(--copilot-border))] last:border-0",
                        "hover:bg-[hsl(var(--copilot-surface))] transition-colors"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                            getAlertColor(alert.type)
                          )}>
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[hsl(var(--copilot-text))]">
                              {alert.title}
                            </p>
                            <p className="text-xs text-[hsl(var(--copilot-text-muted))] mt-0.5 line-clamp-2">
                              {alert.message}
                            </p>
                            <p className="text-[10px] text-[hsl(var(--copilot-text-muted))] mt-1">
                              {alert.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {alert.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-[hsl(var(--copilot-accent))] hover:bg-[hsl(var(--copilot-accent)/0.1)]"
                              onClick={alert.action.onClick}
                            >
                              {alert.action.label}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-text))]"
                            onClick={() => onDismiss(alert.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
