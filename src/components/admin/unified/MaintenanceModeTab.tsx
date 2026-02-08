import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Clock, Globe } from 'lucide-react';
import { toast } from 'sonner';

const MaintenanceModeTab = () => {
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('Scheduled Maintenance');
  const [message, setMessage] = useState('We are performing scheduled maintenance. Please check back soon.');
  const [estimatedEnd, setEstimatedEnd] = useState('');
  const [allowedIPs, setAllowedIPs] = useState('');

  const toggleMaintenance = () => {
    setEnabled(!enabled);
    toast.success(enabled ? 'Maintenance mode disabled' : 'Maintenance mode enabled');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6" /> Maintenance Mode</h2>
        <p className="text-muted-foreground">Control platform availability and display maintenance messages</p>
      </div>

      <Card className={enabled ? 'border-amber-500/50 bg-amber-500/5' : ''}>
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${enabled ? 'bg-amber-500/20' : 'bg-muted'}`}>
              {enabled ? <AlertTriangle className="h-6 w-6 text-amber-500" /> : <Globe className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{enabled ? 'Maintenance Active' : 'Platform Online'}</h3>
              <p className="text-sm text-muted-foreground">{enabled ? 'Users see the maintenance page' : 'All services running normally'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={enabled ? 'destructive' : 'default'}>{enabled ? 'ACTIVE' : 'OFF'}</Badge>
            <Switch checked={enabled} onCheckedChange={toggleMaintenance} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Maintenance Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> Estimated End Time</label>
              <Input type="datetime-local" value={estimatedEnd} onChange={e => setEstimatedEnd(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Allowed IPs (bypass maintenance)</label>
              <Textarea value={allowedIPs} onChange={e => setAllowedIPs(e.target.value)} placeholder="One IP per line" rows={3} className="font-mono text-xs" />
            </div>
            <Button className="w-full" onClick={() => toast.success('Settings saved')}>Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="border rounded-lg p-8 bg-muted/30 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-muted-foreground">{message}</p>
              {estimatedEnd && <p className="text-sm text-muted-foreground">Expected back: {new Date(estimatedEnd).toLocaleString()}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MaintenanceModeTab;
