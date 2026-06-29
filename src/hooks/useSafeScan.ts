import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface ScanResult {
  success: boolean;
  scan_type: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  threats_detected: string[];
  reputation_score: number;
  scan_details: any;
  recommendations: string[];
  timestamp: string;
}

interface PasswordScanResult {
  score: number;
  strength: 'very_weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  time_to_crack: string;
  vulnerabilities: string[];
  improvements: string[];
  is_common: boolean;
  is_breached?: boolean;
  breach_count?: number;
}

export const useScan = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load scan history
  const loadScanHistory = async () => {
    if (!user) return;

    try {
      // Load recent scans from multiple tables
      const [docScans, emailScans] = await Promise.all([
        supabase
          .from('document_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('email_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const allScans = [
        ...(docScans.data || []).map(s => ({ ...s, type: 'document' })),
        ...(emailScans.data || []).map(s => ({ ...s, type: 'email' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setScanHistory(allScans);
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

  // URL/Link Scanning
  const scanURL = async (url: string): Promise<ScanResult | null> => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL to scan",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ultrium-safelink-scanner', {
        body: { url, user_id: user?.id }
      });

      if (error) throw error;

      const result: ScanResult = {
        success: true,
        scan_type: 'url',
        safe: data.safe,
        risk_level: data.risk_level,
        threats_detected: data.threats_detected || [],
        reputation_score: data.reputation_score || 0,
        scan_details: data.scan_details || {},
        recommendations: data.recommendations || [],
        timestamp: new Date().toISOString()
      };

      setResults(result);
      
      toast({
        title: `URL Scan Complete`,
        description: `Risk Level: ${data.risk_level.toUpperCase()} - Score: ${data.reputation_score}/100`,
        variant: data.safe ? "default" : "destructive"
      });

      return result;
    } catch (error) {
      console.error('URL scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to complete URL scan. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Document Scanning
  const scanDocument = async (file: File): Promise<ScanResult | null> => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to scan",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safedoc-scanner', {
        body: {
          user_id: user?.id,
          file_name: file.name,
          file_size: file.size,
          file_data: null // In production, would convert to base64
        }
      });

      if (error) throw error;

      const result: ScanResult = {
        success: true,
        scan_type: 'document',
        safe: data.safe,
        risk_level: data.risk_level,
        threats_detected: data.threats_detected || [],
        reputation_score: data.reputation_score || 0,
        scan_details: data.scan_details || {},
        recommendations: data.recommendations || [],
        timestamp: new Date().toISOString()
      };

      setResults(result);

      toast({
        title: `Document Scan Complete`,
        description: `${file.name} - Risk Level: ${data.risk_level.toUpperCase()}`,
        variant: data.safe ? "default" : "destructive"
      });

      return result;
    } catch (error) {
      console.error('Document scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to complete document scan. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Email Scanning
  const scanEmail = async (emailData: {
    subject: string;
    sender: string;
    content?: string;
    attachments?: string[];
  }): Promise<ScanResult | null> => {
    if (!emailData.subject || !emailData.sender) {
      toast({
        title: "Error",
        description: "Please provide email subject and sender",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safemail-scanner', {
        body: {
          action: 'scan_email',
          email: {
            ...emailData,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      const result: ScanResult = {
        success: true,
        scan_type: 'email',
        safe: data.action === 'allow',
        risk_level: data.riskScore > 80 ? 'critical' : 
                   data.riskScore > 60 ? 'high' : 
                   data.riskScore > 40 ? 'medium' : 
                   data.riskScore > 20 ? 'low' : 'safe',
        threats_detected: data.threats?.map((t: any) => t.description) || [],
        reputation_score: Math.max(0, 100 - data.riskScore),
        scan_details: {
          action: data.action,
          threat_count: data.threats?.length || 0,
          risk_score: data.riskScore
        },
        recommendations: [`Action: ${data.action.toUpperCase()}`],
        timestamp: new Date().toISOString()
      };

      setResults(result);

      toast({
        title: `Email Scan Complete`,
        description: `Risk Score: ${data.riskScore}/100 - Action: ${data.action.toUpperCase()}`,
        variant: data.action === 'allow' ? "default" : "destructive"
      });

      return result;
    } catch (error) {
      console.error('Email scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to complete email scan. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Password Strength Analysis
  const scanPassword = async (password: string, email?: string): Promise<PasswordScanResult | null> => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter a password to analyze",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safepass-scanner', {
        body: {
          action: 'check_password_strength',
          password: password,
          email: email,
          user_id: user?.id
        }
      });

      if (error) throw error;

      const result: PasswordScanResult = {
        score: data.score,
        strength: data.strength,
        time_to_crack: data.time_to_crack || 'Unknown',
        vulnerabilities: data.checks ? Object.entries(data.checks)
          .filter(([_, passed]) => !passed)
          .map(([check, _]) => `Missing ${check}`) : [],
        improvements: data.recommendations || [],
        is_common: !data.checks?.noCommonPatterns,
        is_breached: data.breach?.isBreached || false,
        breach_count: data.breach?.breachCount || 0
      };

      toast({
        title: `Password Analysis Complete`,
        description: `Strength: ${data.strength.toUpperCase()} - Score: ${data.score}/100`,
        variant: data.score >= 70 ? "default" : "destructive"
      });

      return result;
    } catch (error) {
      console.error('Password scan error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to complete password analysis. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Bulk Password Analysis
  const scanPasswords = async (passwords: string[]) => {
    if (!passwords || passwords.length === 0) {
      toast({
        title: "Error",
        description: "Please provide passwords to analyze",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safepass-scanner', {
        body: {
          mode: 'bulk',
          passwords: passwords,
          user_id: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: `Bulk Password Analysis Complete`,
        description: `Analyzed ${passwords.length} passwords - Average Score: ${data.summary.average_score}/100`,
        variant: data.summary.average_score >= 70 ? "default" : "destructive"
      });

      return data;
    } catch (error) {
      console.error('Bulk password scan error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to complete bulk password analysis. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Email Breach Check
  const checkEmailBreaches = async (email: string) => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address to check",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safepass-scanner', {
        body: {
          mode: 'breach_check',
          email: email,
          user_id: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: `Breach Check Complete`,
        description: data.is_breached 
          ? `⚠️ Found in ${data.breach_count} breach(es)` 
          : "✅ No breaches found",
        variant: data.is_breached ? "destructive" : "default"
      });

      return data;
    } catch (error) {
      console.error('Email breach check error:', error);
      toast({
        title: "Check Failed",
        description: "Unable to complete breach check. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Unified Scan API (for API integration)
  const unifiedScan = async (scanType: 'url' | 'document' | 'email' | 'password', data: any) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('safescan-api', {
        body: {
          scan_type: scanType,
          user_id: user?.id,
          data: data
        }
      });

      if (error) throw error;

      setResults(result);
      return result;
    } catch (error) {
      console.error('Unified scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to complete scan. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    results,
    scanHistory,
    loadScanHistory,
    scanURL,
    scanDocument,
    scanEmail,
    scanPassword,
    scanPasswords,
    checkEmailBreaches,
    unifiedScan,
    clearResults: () => setResults(null)
  };
};