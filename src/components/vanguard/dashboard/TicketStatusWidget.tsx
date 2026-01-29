import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TicketStatusWidgetProps {
  open: number;
  pending: number;
  dueToday: number;
  overdue: number;
}

export function TicketStatusWidget({ open, pending, dueToday, overdue }: TicketStatusWidgetProps) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Tickets status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-gray-900">{open}</span>
            <span className="text-sm font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Open</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-gray-900">{pending}</span>
            <span className="text-sm font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded">Pending</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-gray-900">{dueToday}</span>
            <span className="text-sm font-medium text-red-400 bg-red-50 px-2 py-0.5 rounded">Due today</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-gray-900">{overdue}</span>
            <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">Overdue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
