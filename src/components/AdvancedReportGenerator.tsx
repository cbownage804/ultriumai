import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdvancedReportGenerator = () => {
  const { toast } = useToast();
  const [reports] = useState([
    {
      id: '1',
      name: 'Security Report',
      status: 'completed',
      type: 'security',
      created_at: new Date().toISOString()
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Report Generator</h2>
        <Button>
          <Play className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8" />
                  <div>
                    <h4 className="font-semibold">{report.name}</h4>
                    <Badge variant="default">{report.status}</Badge>
                  </div>
                </div>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdvancedReportGenerator;