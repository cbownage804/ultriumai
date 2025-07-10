import { supabase } from '@/integrations/supabase/client';
import { SafeDocScan, ScanDocumentParams } from '@/types/safedoc';
import { fileToBase64 } from '@/utils/fileUtils';

export class SafeDocService {
  // Load all SafeDoc scans for current user
  static async loadScans(): Promise<SafeDocScan[]> {
    const { data, error } = await supabase
      .from('safedoc_scans')
      .select(`
        *,
        safedoc_scan_results(*)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading SafeDoc scans:', error);
      throw error;
    }

    return (data || []) as SafeDocScan[];
  }

  // Scan document with real file upload and virus scanning
  static async scanDocument({ file, mspId, clientId, userEmail }: ScanDocumentParams, userId?: string) {
    // Convert file to base64 for upload
    const fileData = await fileToBase64(file);

    const { data, error } = await supabase.functions.invoke('ultrium-safedoc-scanner', {
      body: {
        file_data: fileData,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        user_id: userId,
        msp_id: mspId,
        client_id: clientId,
        user_email: userEmail
      }
    });

    if (error) throw error;

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

    return data;
  }

  // Get scan by ID
  static async getScan(scanId: string): Promise<SafeDocScan | null> {
    const { data, error } = await supabase
      .from('safedoc_scans')
      .select(`
        *,
        safedoc_scan_results(*)
      `)
      .eq('id', scanId)
      .single();

    if (error) {
      console.error('Error getting scan:', error);
      return null;
    }

    return data as SafeDocScan;
  }
}