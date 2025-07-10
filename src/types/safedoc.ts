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

export interface ScanDocumentParams {
  file: File;
  mspId: string;
  clientId: string;
  userEmail: string;
}

export interface ThreatSummary {
  total: number;
  clean: number;
  threats: number;
  pending: number;
  failed: number;
}