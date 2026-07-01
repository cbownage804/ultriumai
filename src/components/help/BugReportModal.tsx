import { devLog } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bug, Camera, Loader2, Send, CheckCircle, AlertTriangle, Monitor, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
// html2canvas is lazy-loaded on demand to keep it out of the critical bundle
import { cn } from '@/lib/utils';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CapturedData {
  screenshot: string | null;
  pageUrl: string;
  pageRoute: string;
  userAgent: string;
  viewport: string;
  consoleErrors: string;
  timestamp: string;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState<CapturedData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Auto-capture on open
  useEffect(() => {
    if (open && !captured) {
      capturePageData();
    }
    if (!open) {
      // Reset on close
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCaptured(null);
      setSubmitted(false);
    }
  }, [open]);

  const capturePageData = async () => {
    setCapturing(true);
    try {
      // Capture screenshot
      let screenshot: string | null = null;
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          allowTaint: true,
          scale: 0.5, // Lower res for smaller payload
          logging: false,
          ignoreElements: (el) => {
            // Ignore the modal itself and overlays
            return el.getAttribute('role') === 'dialog' || 
                   el.classList.contains('bug-report-ignore');
          },
        });
        screenshot = canvas.toDataURL('image/webp', 0.7);
      } catch (err) {
        devLog.log('Screenshot capture failed:', err);
      }

      // Collect console errors (from window.onerror buffer if available)
      const consoleErrors = (window as any).__capturedErrors?.slice(-5)?.join('\n') || 'None captured';

      setCaptured({
        screenshot,
        pageUrl: window.location.href,
        pageRoute: window.location.pathname + window.location.search,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        consoleErrors,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to capture page data:', err);
    } finally {
      setCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !title.trim()) return;
    
    setSubmitting(true);
    try {
      // Upload screenshot to storage if available
      let screenshotUrl: string | null = null;
      if (captured?.screenshot) {
        const blob = await fetch(captured.screenshot).then(r => r.blob());
        const filename = `${user.id}/${Date.now()}.webp`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bug-screenshots')
          .upload(filename, blob, { contentType: 'image/webp' });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('bug-screenshots').getPublicUrl(filename);
          screenshotUrl = urlData.publicUrl;
        }
      }

      // Insert bug report
      const { error } = await supabase.from('bug_reports').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        screenshot_url: screenshotUrl,
        page_url: captured?.pageUrl || window.location.href,
        page_route: captured?.pageRoute || window.location.pathname,
        user_agent: captured?.userAgent || navigator.userAgent,
        viewport: captured?.viewport || `${window.innerWidth}x${window.innerHeight}`,
        console_errors: captured?.consoleErrors || null,
        priority,
      });

      if (error) throw error;

      // Send email notification to support
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: 'support@ultriumai.com',
            subject: `[Bug Report] ${priority.toUpperCase()}: ${title.trim()}`,
            html: `
              <h2>New Bug Report</h2>
              <p><strong>Title:</strong> ${title.trim()}</p>
              <p><strong>Priority:</strong> ${priority}</p>
              <p><strong>Description:</strong> ${description.trim() || 'No description provided'}</p>
              <hr />
              <p><strong>Page:</strong> ${captured?.pageRoute || window.location.pathname}</p>
              <p><strong>URL:</strong> ${captured?.pageUrl || window.location.href}</p>
              <p><strong>Viewport:</strong> ${captured?.viewport || 'Unknown'}</p>
              <p><strong>User:</strong> ${user.email || user.id}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              ${screenshotUrl ? `<p><strong>Screenshot:</strong> <a href="${screenshotUrl}">View Screenshot</a></p>` : ''}
            `,
          },
        });
      } catch (emailErr) {
        devLog.log('Bug report email notification failed:', emailErr);
        // Don't block submission if email fails
      }

      setSubmitted(true);
      toast.success('Bug report submitted! Thank you for your feedback.');
      setTimeout(() => onOpenChange(false), 1500);
    } catch (err: any) {
      console.error('Failed to submit bug report:', err);
      toast.error('Failed to submit bug report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bug-report-ignore">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            Submit Bug Report
          </DialogTitle>
          <DialogDescription>
            Describe the issue you're experiencing. A screenshot and page data have been automatically captured.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-sm font-medium text-foreground">Bug report submitted!</p>
            <p className="text-xs text-muted-foreground">Thanks for helping us improve.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Auto-captured screenshot preview */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                Page Screenshot
              </Label>
              {capturing ? (
                <div className="h-32 rounded-lg border border-border/50 bg-muted/20 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Capturing screenshot...</span>
                </div>
              ) : captured?.screenshot ? (
                <div className="relative rounded-lg border border-border/50 overflow-hidden">
                  <img
                    src={captured.screenshot}
                    alt="Page screenshot"
                    className="w-full h-32 object-cover object-top"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-[10px]">Auto-captured</Badge>
                  </div>
                </div>
              ) : (
                <div className="h-16 rounded-lg border border-border/50 bg-muted/20 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Screenshot unavailable</span>
                </div>
              )}
            </div>

            {/* Captured metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px] gap-1">
                <MapPin className="h-2.5 w-2.5" />
                {captured?.pageRoute || window.location.pathname}
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Monitor className="h-2.5 w-2.5" />
                {captured?.viewport || `${window.innerWidth}x${window.innerHeight}`}
              </Badge>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="bug-title" className="text-xs">Issue Title *</Label>
              <Input
                id="bug-title"
                placeholder="e.g., Button doesn't respond on click"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="bug-desc" className="text-xs">Description</Label>
              <Textarea
                id="bug-desc"
                placeholder="What happened? What did you expect to happen?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors",
                      priority === p
                        ? p === 'high'
                          ? "border-destructive/50 bg-destructive/10 text-destructive"
                          : p === 'medium'
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
                          : "border-border bg-muted/30 text-muted-foreground"
                        : "border-border/50 hover:bg-muted/20 text-muted-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!title.trim() || submitting || !user}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                Submit Report
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
