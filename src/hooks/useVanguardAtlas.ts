/**
 * Vanguard Atlas Documentation Hook
 * For the Vanguard IT documentation system (ITGlue replica)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AtlasOrganization {
  id: string;
  name: string;
  description?: string;
}

interface AtlasStats {
  organizations: number;
  documents: number;
  passwords: number;
  sslCertificates: number;
  configurations: number;
  runbooks: number;
  expiringItems: number;
  sslExpiring: number;
}

export const useVanguardAtlas = (organizationId?: string) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<AtlasOrganization[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [passwords, setPasswords] = useState<any[]>([]);
  const [sslCertificates, setSslCertificates] = useState<any[]>([]);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [runbooks, setRunbooks] = useState<any[]>([]);
  const [expirations, setExpirations] = useState<any[]>([]);

  const stats: AtlasStats = {
    organizations: organizations.length,
    documents: documents.length,
    passwords: passwords.length,
    sslCertificates: sslCertificates.length,
    configurations: configurations.length,
    runbooks: runbooks.length,
    expiringItems: expirations.filter(e => e.daysUntilExpiry <= 30).length,
    sslExpiring: sslCertificates.filter(c => c.daysUntilExpiry <= 30).length,
  };

  useEffect(() => {
    // Note: Atlas documentation tables not yet implemented
    // This hook will be connected to Supabase when atlas_* tables are created
    setIsLoading(false);
  }, [user, organizationId]);

  return {
    isLoading,
    organizations,
    documents,
    passwords,
    sslCertificates,
    configurations,
    runbooks,
    expirations,
    stats,
  };
};
