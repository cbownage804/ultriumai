import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SafeDocScan {
  id: string;
  msp_id: string;
  client_id: string;
  user_email: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  mime_type: string;
  scan_status: 'pending' | 'scanning' | 'completed' | 'failed';
  threat_level: 'clean' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  threats_found: number;
  scan_results: any;
  scan_engine: string;
  metadata: any;
  created_at: string;
  completed_at: string | null;
  expires_at: string;
}

export interface SafeDocScanResult {
  id: string;
  scan_id: string;
  engine_name: string;
  threat_name: string | null;
  threat_type: string | null;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical' | null;
  description: string | null;
  recommendation: string | null;
  created_at: string;
}

export const useSafeDoc = () => {
  const [scans, setScans] = useState<SafeDocScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load MSP scans
  const loadScans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safedoc_scans')
        .select(`
          *,
          safedoc_scan_results(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setScans((data || []) as SafeDocScan[]);
    } catch (error) {
      console.error('Error loading SafeDoc scans:', error);
      toast({
        title: "Error",
        description: "Failed to load document scans",
        variant: "destructive",
      });
    }
  };

  // Calculate file hash
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:mime/type;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Scan document with real file upload and virus scanning
  const scanDocument = async (
    file: File, 
    mspId: string, 
    clientId: string, 
    userEmail: string
  ) => {
    try {
      // Convert file to base64 for upload
      const fileData = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('ultrium-safedoc-scanner', {
        body: {
          file_data: fileData,
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          user_id: user?.id,
          msp_id: mspId,
          client_id: clientId,
          user_email: userEmail
        }
      });

      if (error) throw error;

      toast({
        title: "Scan Completed",
        description: `Document "${file.name}" has been scanned with ${data.scan_details?.malware_detections || 0} threats detected`,
        variant: data.safe ? "default" : "destructive"
      });

      // Create scan record in database
      const { error: dbError } = await supabase
        .from('safedoc_scans')
        .insert({
          msp_id: mspId,
          client_id: clientId,
          user_email: userEmail,
          file_name: file.name,
          file_size: file.size,
          file_hash: data.file_info?.hash || '',
          mime_type: file.type,
          scan_status: 'completed',
          threat_level: data.safe ? 'clean' : data.risk_level,
          threats_found: data.threats_detected?.length || 0,
          scan_results: data,
          scan_engine: 'VirusTotal + Heuristic',
          metadata: {
            scan_details: data.scan_details,
            recommendations: data.recommendations
          },
          completed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

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
    try {
      const { data, error } = await supabase
        .from('safedoc_scans')
        .select(`
          *,
          safedoc_scan_results(*)
        `)
        .eq('id', scanId)
        .single();

      if (error) throw error;
      return data as SafeDocScan;
    } catch (error) {
      console.error('Error getting scan:', error);
      return null;
    }
  };

  // Get scans by client
  const getScansByClient = (clientId: string): SafeDocScan[] => {
    return scans.filter(scan => scan.client_id === clientId);
  };

  // Get threat summary
  const getThreatSummary = () => {
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