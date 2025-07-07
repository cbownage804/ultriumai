import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NotificationCenter = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Security Alert',
      message: 'Unusual login detected',
      type: 'error',
      read: false,
      created_at: new Date().toISOString()
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Notification Center</h2>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4" />
                <div className="flex-1">
                  <h4 className="font-semibold">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
                <Badge variant="outline">New</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NotificationCenter;