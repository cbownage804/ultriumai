import { Card, CardContent } from "@/components/ui/card";

export const ChatStats = () => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Total Conversations</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Messages Today</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">-</div>
          <p className="text-xs text-muted-foreground">Avg Response Time</p>
        </CardContent>
      </Card>
    </div>
  );
};