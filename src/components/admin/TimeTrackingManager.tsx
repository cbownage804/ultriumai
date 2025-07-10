import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Plus, Edit, Trash2, Calculator, Timer, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface TimeEntry {
  id: string;
  user_id: string;
  ticket_id: string | null;
  description: string;
  hours_worked: number;
  billable: boolean;
  hourly_rate: number | null;
  total_cost: number | null;
  work_date: string;
  created_at: string;
  updated_at: string;
}

export const TimeTrackingManager = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { toast } = useToast();

  useEffect(() => {
    loadTimeEntries();
  }, [selectedMonth]);

  const loadTimeEntries = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.user.id)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error loading time entries:', error);
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTimeEntry = async (entryData: Partial<TimeEntry>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Calculate total cost if hourly rate is provided
      const totalCost = entryData.hourly_rate && entryData.hours_worked 
        ? Number(entryData.hourly_rate) * Number(entryData.hours_worked)
        : null;

      if (editingEntry) {
        const { error } = await supabase
          .from('time_entries')
          .update({
            ticket_id: entryData.ticket_id,
            description: entryData.description,
            hours_worked: entryData.hours_worked,
            billable: entryData.billable,
            hourly_rate: entryData.hourly_rate,
            total_cost: totalCost,
            work_date: entryData.work_date,
          })
          .eq('id', editingEntry.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('time_entries')
          .insert({
            user_id: user.user.id,
            ticket_id: entryData.ticket_id,
            description: entryData.description,
            hours_worked: entryData.hours_worked,
            billable: entryData.billable,
            hourly_rate: entryData.hourly_rate,
            total_cost: totalCost,
            work_date: entryData.work_date,
          });

        if (error) throw error;
      }

      toast({
        title: "✅ Time Entry Saved",
        description: "Time entry has been saved successfully",
      });

      setShowDialog(false);
      setEditingEntry(null);
      loadTimeEntries();
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast({
        title: "Error",
        description: "Failed to save time entry",
        variant: "destructive",
      });
    }
  };

  const deleteTimeEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "✅ Time Entry Deleted",
        description: "Time entry has been deleted successfully",
      });

      loadTimeEntries();
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    }
  };

  // Calculate totals
  const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours_worked), 0);
  const billableHours = timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + Number(entry.hours_worked), 0);
  const totalRevenue = timeEntries.reduce((sum, entry) => sum + (Number(entry.total_cost) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Time Tracking
          </h2>
          <p className="text-muted-foreground">
            Track time spent on tickets and projects
          </p>
        </div>
        
        <div className="flex gap-2 items-center">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
          
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEntry(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Log Time
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Edit Time Entry' : 'Log Time Entry'}
                </DialogTitle>
              </DialogHeader>
              <TimeEntryForm
                entry={editingEntry}
                onSave={saveTimeEntry}
                onCancel={() => setShowDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billableHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {totalHours > 0 ? ((billableHours / totalHours) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries List */}
      <div className="space-y-4">
        {timeEntries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{entry.description}</h3>
                    <Badge variant={entry.billable ? "default" : "secondary"}>
                      {entry.billable ? "Billable" : "Non-billable"}
                    </Badge>
                    {entry.ticket_id && (
                      <Badge variant="outline">
                        Ticket: {entry.ticket_id.slice(0, 8)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>📅 {format(new Date(entry.work_date), 'MMM dd, yyyy')}</span>
                    <span>⏰ {entry.hours_worked}h</span>
                    {entry.hourly_rate && (
                      <span>💰 ${entry.hourly_rate}/hr</span>
                    )}
                    {entry.total_cost && (
                      <span className="font-medium text-foreground">
                        Total: ${entry.total_cost.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingEntry(entry);
                      setShowDialog(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteTimeEntry(entry.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {timeEntries.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No Time Entries</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No time entries found for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface TimeEntryFormProps {
  entry: TimeEntry | null;
  onSave: (data: Partial<TimeEntry>) => void;
  onCancel: () => void;
}

const TimeEntryForm = ({ entry, onSave, onCancel }: TimeEntryFormProps) => {
  const [formData, setFormData] = useState({
    ticket_id: entry?.ticket_id || '',
    description: entry?.description || '',
    hours_worked: entry?.hours_worked || 0,
    billable: entry?.billable ?? true,
    hourly_rate: entry?.hourly_rate || 0,
    work_date: entry?.work_date || format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      ticket_id: formData.ticket_id || null,
      hourly_rate: formData.hourly_rate || null,
    });
  };

  const calculatedTotal = formData.hourly_rate && formData.hours_worked 
    ? (formData.hourly_rate * formData.hours_worked).toFixed(2)
    : '0.00';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="work_date">Date</Label>
          <Input
            id="work_date"
            type="date"
            value={formData.work_date}
            onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="hours_worked">Hours Worked</Label>
          <Input
            id="hours_worked"
            type="number"
            step="0.25"
            min="0"
            value={formData.hours_worked}
            onChange={(e) => setFormData({ ...formData, hours_worked: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What work was performed?"
          required
        />
      </div>

      <div>
        <Label htmlFor="ticket_id">Ticket ID (Optional)</Label>
        <Input
          id="ticket_id"
          value={formData.ticket_id}
          onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })}
          placeholder="Enter ticket ID if applicable"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
          <Input
            id="hourly_rate"
            type="number"
            step="0.01"
            min="0"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Total Cost</Label>
          <div className="h-10 px-3 py-2 border border-input bg-muted rounded-md flex items-center">
            ${calculatedTotal}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="billable"
          checked={formData.billable}
          onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })}
        />
        <Label htmlFor="billable">Billable Time</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {entry ? 'Update Entry' : 'Log Time'}
        </Button>
      </div>
    </form>
  );
};