import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Settings } from "lucide-react";

interface PatchData {
  category: string;
  critical: number;
  important: number;
  optional: number;
  deployed: number;
}

interface PatchManagerProps {
  patchingData: PatchData[];
}

export const PatchManager = ({ patchingData }: PatchManagerProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Patch Management
          </CardTitle>
          <CardDescription>Update status across all systems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {patchingData.map((patch) => (
            <div key={patch.category} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{patch.category}</h4>
                <Badge variant="outline">{patch.deployed} deployed</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div className="font-medium text-red-600">{patch.critical}</div>
                  <div className="text-xs text-muted-foreground">Critical</div>
                </div>
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <div className="font-medium text-orange-600">{patch.important}</div>
                  <div className="text-xs text-muted-foreground">Important</div>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="font-medium text-blue-600">{patch.optional}</div>
                  <div className="text-xs text-muted-foreground">Optional</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Patch Scheduling
          </CardTitle>
          <CardDescription>Automated deployment windows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
            <h4 className="font-medium text-green-700 dark:text-green-400">Production Schedule</h4>
            <p className="text-sm text-muted-foreground mt-1">Critical patches: Every Tuesday 2:00 AM</p>
            <p className="text-sm text-muted-foreground">Regular patches: First Sunday of month</p>
          </div>
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <h4 className="font-medium text-blue-700 dark:text-blue-400">Test Environment</h4>
            <p className="text-sm text-muted-foreground mt-1">All patches: Every Friday 6:00 PM</p>
            <p className="text-sm text-muted-foreground">Validation: Weekend testing cycle</p>
          </div>
          <Button className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Configure Patch Windows
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};