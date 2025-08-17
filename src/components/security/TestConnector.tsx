import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

export const TestConnector = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  const registerTestConnector = async () => {
    setIsRegistering(true);
    
    try {
      const response = await supabase.functions.invoke('vanguard-network-connector', {
        body: {
          action: 'register',
          connectorId: 'test-connector-001',
          data: {
            name: 'Test Network Connector',
            location: 'Demo Environment',
            networkRanges: ['192.168.1.0/24', '10.0.0.0/24'],
            capabilities: ['discovery', 'vulnerability', 'compliance'],
            version: '1.0.0',
            osInfo: { platform: 'linux', version: '22.04' },
            toolsAvailable: ['nmap', 'openvas', 'nikto']
          }
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Test Connector Registered",
        description: "Demo network connector is now active and ready for testing",
      });

    } catch (error) {
      console.error('Test connector registration failed:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register test connector",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Test Internal Scanner
        </CardTitle>
        <CardDescription>
          Register a demo network connector to test the internal scanning functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={registerTestConnector}
          disabled={isRegistering}
          className="w-full"
        >
          {isRegistering ? 'Registering...' : 'Register Test Connector'}
        </Button>
      </CardContent>
    </Card>
  );
};