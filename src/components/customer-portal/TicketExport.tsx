/**
 * Ticket Export Component
 * Export ticket history as PDF or CSV
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  description?: string;
}

interface TicketExportProps {
  tickets: Ticket[];
  companyName?: string;
}

export function TicketExport({ tickets, companyName = 'Customer Portal' }: TicketExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['ID', 'Subject', 'Status', 'Priority', 'Category', 'Created', 'Updated'];
      const rows = tickets.map(t => [
        t.id.slice(0, 8),
        `"${t.subject.replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        t.category || 'N/A',
        format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
        format(new Date(t.updated_at), 'yyyy-MM-dd HH:mm'),
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `tickets-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();

      toast.success('Tickets exported as CSV');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export tickets');
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 150, 180);
      doc.text('Ticket History Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(companyName, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, 34, { align: 'center' });
      
      // Summary
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Summary', 14, 48);
      
      doc.setFontSize(10);
      const openCount = tickets.filter(t => t.status === 'open').length;
      const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
      const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
      
      doc.text(`Total Tickets: ${tickets.length}`, 14, 56);
      doc.text(`Open: ${openCount} | In Progress: ${inProgressCount} | Resolved: ${resolvedCount}`, 14, 62);

      // Tickets list
      let y = 76;
      doc.setFontSize(12);
      doc.text('Ticket Details', 14, y);
      y += 8;

      tickets.forEach((ticket, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(0, 150, 180);
        doc.text(`#${ticket.id.slice(0, 8)} - ${ticket.subject.slice(0, 50)}${ticket.subject.length > 50 ? '...' : ''}`, 14, y);
        
        doc.setFontSize(9);
        doc.setTextColor(80);
        y += 5;
        doc.text(`Status: ${ticket.status} | Priority: ${ticket.priority} | Created: ${format(new Date(ticket.created_at), 'MMM d, yyyy')}`, 14, y);
        
        y += 10;
      });

      doc.save(`tickets-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Tickets exported as PDF');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export tickets');
    } finally {
      setIsExporting(false);
    }
  };

  if (tickets.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
        <DropdownMenuItem 
          onClick={exportCSV}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <Table className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={exportPDF}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
