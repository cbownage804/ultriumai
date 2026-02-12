// =============================================================================
// Vanguard Remote Access Configuration
// Centralized configuration for MeshCentral-based remote access
// =============================================================================

/**
 * Supported remote access providers
 */
export const REMOTE_ACCESS_PROVIDERS = {
  meshcentral: {
    id: 'meshcentral',
    name: 'MeshCentral',
    icon: '🌐',
    color: 'bg-emerald-500',
    description: 'Zero-touch browser remote desktop (Primary)',
    protocol: 'https://',
    isBuiltIn: true,
    isPrimary: true,
  },
  anydesk: {
    id: 'anydesk',
    name: 'AnyDesk',
    icon: '🔴',
    color: 'bg-red-500',
    description: 'Fast remote desktop',
    protocol: 'anydesk:',
    isBuiltIn: false,
    isPrimary: false,
  },
  teamviewer: {
    id: 'teamviewer',
    name: 'TeamViewer',
    icon: '🔵',
    color: 'bg-cyan-500',
    description: 'Enterprise remote support',
    protocol: 'teamviewer10://control?device=',
    isBuiltIn: false,
    isPrimary: false,
  },
  splashtop: {
    id: 'splashtop',
    name: 'Splashtop',
    icon: '💧',
    color: 'bg-blue-500',
    description: 'Business remote access',
    protocol: 'splashtop://',
    isBuiltIn: false,
    isPrimary: false,
  },
} as const;

export type RemoteAccessProvider = keyof typeof REMOTE_ACCESS_PROVIDERS;

/**
 * Check if any remote access provider is configured
 */
export function isRemoteAccessConfigured(): boolean {
  return true; // MeshCentral is always available when agent is deployed
}
