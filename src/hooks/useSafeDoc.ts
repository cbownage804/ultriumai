import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SafeDocScan, ScanDocumentParams, ThreatSummary } from '@/types/safedoc';
import { SafeDocService } from '@/services/safedocService';

export const useSafeDoc = () => {
  const [scans, setScans] = useState<SafeDocScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load SafeDoc scans
  const loadScans = async () => {
    if (!user) return;

    try {
      const data = await SafeDocService.loadScans();
      setScans(data);
    } catch (error) {
      console.error('Error loading SafeDoc scans:', error);
      toast({
        title: "Error",
        description: "Failed to load document scans",
        variant: "destructive",
      });
    }
  };

  // Scan document
  const scanDocument = async (
    file: File, 
    mspId: string, 
    clientId: string, 
    userEmail: string
  ) => {
    try {
      const data = await SafeDocService.scanDocument({
        file,
        mspId,
        clientId,
        userEmail
      }, user?.id);

      toast({
        title: "Scan Completed",
        description: `Document "${file.name}" has been scanned with ${data.scan_details?.malware_detections || 0} threats detected`,
        variant: data.safe ? "default" : "destructive"
      });

      // Reload scans to show new scan
      await loadScans();

      return data;
    } catch (error) {
      console.error('Error scanning document:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to scan document. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get scan by ID
  const getScan = async (scanId: string): Promise<SafeDocScan | null> => {
    return SafeDocService.getScan(scanId);
  };

  // Get scans by client
  const getScansByClient = (clientId: string): SafeDocScan[] => {
    return scans.filter(scan => scan.client_id === clientId);
  };

  // Get threat summary
  const getThreatSummary = (): ThreatSummary => {
    const summary = {
      total: scans.length,
      clean: 0,
      threats: 0,
      pending: 0,
      failed: 0
    };

    scans.forEach(scan => {
      switch (scan.scan_status) {
        case 'pending':
        case 'scanning':
          summary.pending++;
          break;
        case 'failed':
          summary.failed++;
          break;
        case 'completed':
          if (scan.threat_level === 'clean') {
            summary.clean++;
          } else {
            summary.threats++;
          }
          break;
      }
    });

    return summary;
  };

  // Initialize
  useEffect(() => {
    if (user) {
      loadScans();
    }
    setIsLoading(false);
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('safedoc-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'safedoc_scans'
        },
        () => {
          loadScans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    scans,
    isLoading,
    scanDocument,
    getScan,
    getScansByClient,
    getThreatSummary,
    loadScans
  };
};