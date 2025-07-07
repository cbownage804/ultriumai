import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Settings, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const IntegrationsManager = () => {
  const { toast } = useToast();
  const [integrations] = useState([
    {
      id: '1',
      name: 'Slack Integration',
      status: 'active',
      provider: 'Slack',
      enabled: true
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Integrations</h2>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <div>
                    <h4 className="font-semibold">{integration.name}</h4>
                    <Badge variant="default">{integration.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Switch checked={integration.enabled} />
                  <Button variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsManager;