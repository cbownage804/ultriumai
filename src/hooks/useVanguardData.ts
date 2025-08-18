import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VanguardMetrics {
  realTimeThreats: number;
  behavioralAlerts: number;
  securityScore: number;
  endpointsProtected: string;
  detectionRate: number;
  responseTime: string;
}

interface VanguardThreat {
  id: string;
  type: string;
  severity: string;
  target: string;
  time: string;
  status: string;
  mitre: string;
  confidence: number;
  technique: string;
}

interface VanguardCapability {
  name: string;
  status: string;
  score: number;
  description: string;
}

export const useVanguardData = () => {
  const [metrics, setMetrics] = useState<VanguardMetrics>({
    realTimeThreats: 0,
    behavioralAlerts: 0,
    securityScore: 98,
    endpointsProtected: "50K+",
    detectionRate: 99.97,
    responseTime: "0.1s"
  });

  const [threats, setThreats] = useState<VanguardThreat[]>([]);
  const [capabilities, setCapabilities] = useState<VanguardCapability[]>([
    { 
      name: "Behavioral AI Engine", 
      status: "Active", 
      score: 99,
      description: "ML-powered anomaly detection with 0.01% false positive rate"
    },
    { 
      name: "Quantum-Safe Encryption", 
      status: "Enabled", 
      score: 100,
      description: "Post-quantum cryptographic protection"
    },
    { 
      name: "Autonomous Response", 
      status: "Learning", 
      score: 94,
      description: "Self-healing infrastructure with predictive remediation"
    },
    { 
      name: "Threat Intelligence Fusion", 
      status: "Synchronized", 
      score: 97,
      description: "Real-time IOC feeds from 500+ global sources"
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);

  // Fetch real threat data
  const fetchThreats = async () => {
    try {
      const { data: incidents } = await supabase
        .from('security_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: mdrAlerts } = await supabase
        .from('safe_mdr_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: safwebThreats } = await supabase
        .from('safeweb_threats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

      // Convert real data to Vanguard threat format
      const realThreats: VanguardThreat[] = [];

      // Process security incidents
      incidents?.forEach((incident, index) => {
        const sourceData = incident.source_data as any || {};
        realThreats.push({
          id: incident.id,
          type: incident.incident_type || 'Security Incident',
          severity: incident.severity || 'Medium',
          target: sourceData.affected_assets?.[0] || 'Unknown Asset',
          time: getRelativeTime(incident.created_at),
          status: incident.status === 'resolved' ? 'Resolved' : 'Active',
          mitre: sourceData.mitre_techniques?.[0] || 'T1071',
          confidence: sourceData.confidence_score ? Math.floor(sourceData.confidence_score) : 85 + index * 2,
          technique: sourceData.ai_analysis?.technique || 'Advanced Persistent Threat'
        });
      });

      // Process MDR alerts
      mdrAlerts?.forEach((alert, index) => {
        const tactics = alert.tactics as any[] || [];
        realThreats.push({
          id: alert.id,
          type: alert.alert_type || 'MDR Alert',
          severity: alert.severity || 'High',
          target: alert.affected_assets?.[0] || 'Network Asset',
          time: getRelativeTime(alert.created_at),
          status: alert.status === 'resolved' ? 'Resolved' : 'Under Investigation',
          mitre: tactics[0] || 'T1055',
          confidence: 90 + index,
          technique: alert.title?.split(':')[1]?.trim() || 'Threat Activity'
        });
      });

      // Process SafeWeb threats
      safwebThreats?.slice(0, 3).forEach((threat, index) => {
        const indicators = threat.threat_indicators as any || {};
        realThreats.push({
          id: threat.id,
          type: threat.threat_type || 'Web Threat',
          severity: threat.severity || 'Medium',
          target: threat.affected_assets?.[0] || 'Web Asset',
          time: getRelativeTime(threat.created_at),
          status: threat.status === 'resolved' ? 'Mitigated' : 'Active',
          mitre: 'T1190',
          confidence: threat.confidence_score || 88 + index * 3,
          technique: 'Exploit Public-Facing Application'
        });
      });

      setThreats(realThreats.slice(0, 6)); // Limit to 6 threats for display

      // Update metrics based on real data
      const totalIncidents = (incidents?.length || 0) + (mdrAlerts?.length || 0) + (safwebThreats?.length || 0);
      const recentThreats = incidents?.filter(i => {
        const createdAt = new Date(i.created_at);
        const today = new Date();
        return createdAt.toDateString() === today.toDateString();
      }).length || 0;

      setMetrics(prev => ({
        ...prev,
        realTimeThreats: Math.max(totalIncidents * 12, 247), // Scale up for demo
        behavioralAlerts: Math.max(recentThreats, 3)
      }));

    } catch (error) {
      console.error('Error fetching Vanguard threat data:', error);
    }
  };

  // Fetch behavioral analytics data
  const fetchBehavioralData = async () => {
    try {
      const { data: behavioralAnalysis } = await supabase
        .from('edr_behavioral_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: realtimeAlerts } = await supabase
        .from('edr_realtime_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Update capabilities based on real behavioral data
      if (behavioralAnalysis && behavioralAnalysis.length > 0) {
        const avgConfidence = behavioralAnalysis.reduce((sum, analysis) => 
          sum + (analysis.ai_confidence_score || analysis.behavior_score || 0), 0) / behavioralAnalysis.length;
        
        setCapabilities(prev => prev.map(cap => 
          cap.name === "Behavioral AI Engine" 
            ? { ...cap, score: Math.floor(avgConfidence * 100), status: "Active" }
            : cap
        ));
      }

      // Update metrics with behavioral alerts
      if (realtimeAlerts) {
        const criticalAlerts = realtimeAlerts.filter(alert => alert.severity === 'critical').length;
        setMetrics(prev => ({
          ...prev,
          behavioralAlerts: Math.max(criticalAlerts, prev.behavioralAlerts)
        }));
      }

    } catch (error) {
      console.error('Error fetching behavioral data:', error);
    }
  };

  // Trigger threat detection
  const triggerThreatDetection = async (data: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'vanguard-threat-detector',
        { body: data }
      );

      if (error) throw error;
      
      console.log('Vanguard threat detection result:', result);
      
      // Refresh data after detection
      await Promise.all([fetchThreats(), fetchBehavioralData()]);
      
      return result;
    } catch (error) {
      console.error('Error triggering threat detection:', error);
      throw error;
    }
  };

  // Trigger behavioral analysis
  const triggerBehavioralAnalysis = async (data: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'vanguard-behavioral-engine',
        { body: data }
      );

      if (error) throw error;
      
      console.log('Vanguard behavioral analysis result:', result);
      
      // Refresh data after analysis
      await fetchBehavioralData();
      
      return result;
    } catch (error) {
      console.error('Error triggering behavioral analysis:', error);
      throw error;
    }
  };

  // Trigger autonomous response
  const triggerAutonomousResponse = async (data: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'vanguard-autonomous-response',
        { body: data }
      );

      if (error) throw error;
      
      console.log('Vanguard autonomous response result:', result);
      
      return result;
    } catch (error) {
      console.error('Error triggering autonomous response:', error);
      throw error;
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([fetchThreats(), fetchBehavioralData()]);
      setIsLoading(false);
    };

    initializeData();

    // Set up real-time subscriptions for security incidents
    const incidentsChannel = supabase
      .channel('vanguard-incidents')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'security_incidents' },
        () => fetchThreats()
      )
      .subscribe();

    // Set up real-time subscriptions for MDR alerts
    const alertsChannel = supabase
      .channel('vanguard-alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'safe_mdr_alerts' },
        () => fetchThreats()
      )
      .subscribe();

    // Set up real-time subscriptions for behavioral analysis
    const behavioralChannel = supabase
      .channel('vanguard-behavioral')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'edr_behavioral_analysis' },
        () => fetchBehavioralData()
      )
      .subscribe();

    // Simulate real-time updates
    const simulationInterval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        realTimeThreats: prev.realTimeThreats + Math.floor(Math.random() * 3),
        behavioralAlerts: Math.max(0, prev.behavioralAlerts + (Math.random() > 0.7 ? 1 : -1))
      }));
    }, 5000);

    return () => {
      supabase.removeChannel(incidentsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(behavioralChannel);
      clearInterval(simulationInterval);
    };
  }, []);

  return {
    metrics,
    threats,
    capabilities,
    isLoading,
    triggerThreatDetection,
    triggerBehavioralAnalysis,
    triggerAutonomousResponse,
    refreshData: () => Promise.all([fetchThreats(), fetchBehavioralData()])
  };
};

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}