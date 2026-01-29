import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertStatusWidgetProps {
  warning: number;
  critical: number;
}

export function AlertStatusWidget({ warning, critical }: AlertStatusWidgetProps) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Alerts status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-gray-900">{warning}</span>
            <span className="text-sm font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-gray-900">{critical}</span>
            <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
