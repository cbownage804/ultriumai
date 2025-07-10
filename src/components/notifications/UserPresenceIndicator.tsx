import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useUserPresence } from '@/hooks/useUserPresence';
import { Users, Circle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const UserPresenceIndicator = () => {
  const { userPresence, currentUserStatus, updatePresence, onlineUsers, awayUsers, busyUsers } = useUserPresence();
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'away': return 'text-yellow-500';
      case 'busy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Circle className="h-2 w-2 fill-current" />;
      case 'away': return <Clock className="h-2 w-2" />;
      case 'busy': return <AlertCircle className="h-2 w-2" />;
      default: return <Circle className="h-2 w-2" />;
    }
  };

  const handleStatusChange = (status: 'online' | 'away' | 'busy' | 'offline') => {
    updatePresence(status, window.location.pathname);
    setIsOpen(false);
  };

  const totalOnline = onlineUsers.length + awayUsers.length + busyUsers.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Users className="h-4 w-4 mr-2" />
          <span className={getStatusIcon(currentUserStatus).props.className}>
            {getStatusIcon(currentUserStatus)}
          </span>
          <span className="ml-2">{totalOnline}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Your Status</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={currentUserStatus === 'online' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('online')}
                className="justify-start"
              >
                <Circle className="h-2 w-2 fill-green-500 text-green-500 mr-2" />
                Online
              </Button>
              <Button
                variant={currentUserStatus === 'away' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('away')}
                className="justify-start"
              >
                <Clock className="h-2 w-2 text-yellow-500 mr-2" />
                Away
              </Button>
              <Button
                variant={currentUserStatus === 'busy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('busy')}
                className="justify-start"
              >
                <AlertCircle className="h-2 w-2 text-red-500 mr-2" />
                Busy
              </Button>
              <Button
                variant={currentUserStatus === 'offline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('offline')}
                className="justify-start"
              >
                <Circle className="h-2 w-2 text-gray-500 mr-2" />
                Offline
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Team Status</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {userPresence.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No other users online
                </p>
              ) : (
                userPresence.map((presence) => (
                  <Card key={presence.user_id} className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={getStatusColor(presence.status)}>
                          {getStatusIcon(presence.status)}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            User {presence.user_id.slice(0, 8)}...
                          </p>
                          {presence.current_page && (
                            <p className="text-xs text-muted-foreground">
                              {presence.current_page}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true })}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {totalOnline > 0 && (
            <>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Online:</span>
                <div className="flex items-center gap-4">
                  <span className="text-green-500">{onlineUsers.length}</span>
                  <span className="text-yellow-500">{awayUsers.length}</span>
                  <span className="text-red-500">{busyUsers.length}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};