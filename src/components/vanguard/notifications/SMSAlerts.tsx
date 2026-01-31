import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Plus, Edit, Trash2, Send, Users, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { PremiumCard } from '../ui';
import { useToast } from '@/hooks/use-toast';

interface SMSRecipient {
  id: string;
  name: string;
  phone: string;
  role: string;
  isActive: boolean;
  alertTypes: string[];
}

export const SMSAlerts = () => {
  const { toast } = useToast();
  const [recipients, setRecipients] = useState<SMSRecipient[]>([
    { id: '1', name: 'John Smith', phone: '+1 555-0123', role: 'IT Manager', isActive: true, alertTypes: ['critical', 'sla_breach'] },
    { id: '2', name: 'Sarah Johnson', phone: '+1 555-0124', role: 'Security Lead', isActive: true, alertTypes: ['critical', 'security_incident'] },
    { id: '3', name: 'Mike Davis', phone: '+1 555-0125', role: 'On-Call Engineer', isActive: true, alertTypes: ['critical', 'sla_breach', 'escalation'] },
    { id: '4', name: 'Emily Chen', phone: '+1 555-0126', role: 'NOC Manager', isActive: false, alertTypes: ['critical'] },
  ]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const smsCredits = {
    used: 750,
    total: 2000,
    percentage: 37.5,
  };

  const handleToggle = (id: string) => {
    setRecipients(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const handleDelete = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Recipient removed', variant: 'destructive' });
  };

  const handleTestSMS = (recipient: SMSRecipient) => {
    toast({ 
      title: 'Test SMS sent', 
      description: `Sent to ${recipient.phone}` 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SMS Alerts</h3>
          <p className="text-sm text-muted-foreground">Configure SMS notifications for critical alerts</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              Add Recipient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-[hsl(var(--vanguard-card))] border-white/10">
            <DialogHeader>
              <DialogTitle>Add SMS Recipient</DialogTitle>
            </DialogHeader>
            <RecipientEditor onSave={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* SMS Credits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PremiumCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">SMS Credits</p>
              <p className="text-xl font-bold">{smsCredits.total - smsCredits.used}</p>
              <Progress value={100 - smsCredits.percentage} className="h-1 mt-2" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sent This Month</p>
              <p className="text-xl font-bold">{smsCredits.used}</p>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Recipients</p>
              <p className="text-xl font-bold">{recipients.filter(r => r.isActive).length}</p>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Alert Types Configuration */}
      <PremiumCard variant="glass" className="p-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-cyan-400" />
          SMS Alert Triggers
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'critical', label: 'Critical Alerts', color: 'bg-red-500/20 text-red-400', enabled: true },
            { id: 'sla_breach', label: 'SLA Breaches', color: 'bg-orange-500/20 text-orange-400', enabled: true },
            { id: 'security_incident', label: 'Security Incidents', color: 'bg-purple-500/20 text-purple-400', enabled: true },
            { id: 'escalation', label: 'Escalations', color: 'bg-yellow-500/20 text-yellow-400', enabled: false },
          ].map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Badge className={alert.color}>{alert.label}</Badge>
              </div>
              <Switch defaultChecked={alert.enabled} />
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Recipients List */}
      <div className="grid gap-4">
        {recipients.map((recipient, index) => (
          <motion.div
            key={recipient.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PremiumCard variant="glass" className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <Phone className="h-5 w-5 text-green-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{recipient.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {recipient.role}
                    </Badge>
                    {!recipient.isActive && (
                      <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{recipient.phone}</p>
                  <div className="flex flex-wrap gap-1">
                    {recipient.alertTypes.map(type => (
                      <Badge key={type} variant="secondary" className="text-xs bg-white/5">
                        {type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={recipient.isActive}
                    onCheckedChange={() => handleToggle(recipient.id)}
                  />
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleTestSMS(recipient)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(recipient.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const RecipientEditor = ({ onSave }: { onSave: () => void }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');

  const handleSave = () => {
    toast({ title: 'Recipient added successfully' });
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., John Smith"
          className="bg-white/5 border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label>Phone Number</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555-0123"
          className="bg-white/5 border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="it_manager">IT Manager</SelectItem>
            <SelectItem value="security_lead">Security Lead</SelectItem>
            <SelectItem value="on_call">On-Call Engineer</SelectItem>
            <SelectItem value="noc_manager">NOC Manager</SelectItem>
            <SelectItem value="executive">Executive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" className="border-white/10">
          <Send className="h-4 w-4 mr-2" />
          Send Test
        </Button>
        <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-500">
          Add Recipient
        </Button>
      </div>
    </div>
  );
};
