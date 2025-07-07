import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BulkOperations = () => {
  const { toast } = useToast();
  const [operations] = useState([
    {
      id: '1',
      name: 'User Role Update',
      status: 'running',
      progress: 65,
      total_items: 100
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Bulk Operations</h2>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          New Operation
        </Button>
      </div>

      <div className="space-y-4">
        {operations.map((operation) => (
          <Card key={operation.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{operation.name}</h4>
                  <Badge variant="secondary">{operation.status}</Badge>
                  <Progress value={operation.progress} className="mt-2" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Pause className="h-4 w-4" />
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

export default BulkOperations;