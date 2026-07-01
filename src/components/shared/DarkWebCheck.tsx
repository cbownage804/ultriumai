import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, CheckCircle, Shield, Loader2, 
  Eye, EyeOff, Globe, Database, Lock, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BreachResult {
  found: boolean;
  breaches: Array<{
    name: string;
    domain: string;
    breach_date: string;
    data_classes: string[];
  }>;
  leakedData: Array<{
    database_name: string;
    email: string;
    password?: string;
    username?: string;
    ip_address?: string;
  }>;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  total_exposures: number;
}

interface DarkWebCheckProps {
  defaultEmail?: string;
  onClose?: () => void;
  compact?: boolean;
  userId?: string;
}

export function DarkWebCheck({ defaultEmail = '', onClose, compact = false, userId }: DarkWebCheckProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(defaultEmail);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<BreachResult | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const checkEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to check",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('dark-web-monitor', {
        body: { 
          action: 'check_email', 
          email,
          user_id: userId
        }
      });

      if (error) throw error;

      const breachResult: BreachResult = {
        found: (data.breaches?.length > 0) || (data.leakedData?.length > 0),
        breaches: data.breaches || [],
        leakedData: data.leakedData || [],
        risk_level: data.risk_level || 'safe',
        total_exposures: (data.breaches?.length || 0) + (data.leakedData?.length || 0)
      };

      setResult(breachResult);

      if (breachResult.found) {
        toast({
          title: "⚠️ Breaches Found",
          description: `Found ${breachResult.total_exposures} exposures for this email`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ No Breaches Found",
          description: "This email was not found in any known data breaches"
        });
      }
    } catch (error: any) {
      console.error('Dark web check error:', error);
      toast({
        title: "Check Failed",
        description: error.message || "Failed to check email against breach databases",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-emerald-500 bg-emerald-500/10';
    }
  };

  const maskPassword = (password: string) => {
    if (!password) return '••••••••';
    if (showPasswords) return password;
    return password.slice(0, 2) + '••••••' + password.slice(-2);
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to check..."
            className="flex-1 bg-card border-white/10 text-white"
            onKeyDown={(e) => e.key === 'Enter' && checkEmail()}
          />
          <Button 
            onClick={checkEmail}
            disabled={isChecking}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          </Button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Alert className={result.found ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}>
                {result.found ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                )}
                <AlertDescription className={result.found ? 'text-red-200' : 'text-emerald-200'}>
                  {result.found 
                    ? `Found in ${result.total_exposures} breach${result.total_exposures > 1 ? 'es' : ''}`
                    : 'No breaches found'
                  }
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Card className="bg-card border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Dark Web Monitor</CardTitle>
              <p className="text-xs text-gray-500">Powered by Dehashed Intelligence</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to check..."
            className="flex-1 bg-card border-purple-500/20 text-white"
            onKeyDown={(e) => e.key === 'Enter' && checkEmail()}
          />
          <Button 
            onClick={checkEmail}
            disabled={isChecking}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Check
              </>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className={`p-4 rounded-lg border ${result.found ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.found ? (
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    )}
                    <div>
                      <p className={`font-semibold ${result.found ? 'text-red-400' : 'text-emerald-400'}`}>
                        {result.found ? `${result.total_exposures} Exposures Found` : 'No Breaches Detected'}
                      </p>
                      <p className="text-xs text-gray-500">{email}</p>
                    </div>
                  </div>
                  <Badge className={getRiskColor(result.risk_level)}>
                    {result.risk_level.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Breaches */}
              {result.breaches.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4 text-orange-400" />
                    Known Breaches ({result.breaches.length})
                  </h4>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {result.breaches.map((breach, i) => (
                        <div key={i} className="p-3 rounded-lg bg-card border border-orange-500/20">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">{breach.name}</span>
                            <span className="text-xs text-gray-500">{breach.breach_date}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {breach.data_classes?.slice(0, 5).map((dataClass, j) => (
                              <Badge key={j} variant="outline" className="text-xs border-gray-700 text-gray-400">
                                {dataClass}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Leaked Credentials */}
              {result.leakedData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Lock className="h-4 w-4 text-red-400" />
                      Leaked Credentials ({result.leakedData.length})
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-gray-400 hover:text-white"
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {result.leakedData.map((leak, i) => (
                        <div key={i} className="p-3 rounded-lg bg-card border border-red-500/20">
                          <div className="text-xs text-gray-500 mb-1">{leak.database_name}</div>
                          <div className="space-y-1">
                            {leak.email && (
                              <div className="text-sm text-gray-300">
                                <span className="text-gray-500">Email:</span> {leak.email}
                              </div>
                            )}
                            {leak.password && (
                              <div className="text-sm text-red-300">
                                <span className="text-gray-500">Password:</span> {maskPassword(leak.password)}
                              </div>
                            )}
                            {leak.username && (
                              <div className="text-sm text-gray-300">
                                <span className="text-gray-500">Username:</span> {leak.username}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Recommendations */}
              {result.found && (
                <Alert className="border-amber-500/30 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-200 text-sm">
                    <strong>Recommended Actions:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Change passwords for affected accounts immediately</li>
                      <li>Enable two-factor authentication where possible</li>
                      <li>Monitor accounts for suspicious activity</li>
                      <li>Use unique passwords for each account</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
