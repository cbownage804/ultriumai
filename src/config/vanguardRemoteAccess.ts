// =============================================================================
// Vanguard Remote Access Configuration
// Centralized configuration for built-in RustDesk relay infrastructure
// =============================================================================

export interface RemoteAccessConfig {
  // RustDesk relay server hostname (e.g., "relay.vanguard.io")
  relayServer: string;
  
  // RustDesk server public key (from id_ed25519.pub)
  publicKey: string;
  
  // Optional API server for RustDesk Pro features
  apiServer?: string;
  
  // Whether to auto-install RustDesk on agent enrollment
  autoInstall: boolean;
  
  // RustDesk version to install
  rustdeskVersion: string;
}

/**
 * Production relay configuration
 * UPDATE THESE VALUES after deploying your RustDesk server
 */
export const REMOTE_ACCESS_CONFIG: RemoteAccessConfig = {
  // Your self-hosted RustDesk relay server
  // Deploy using: docs/RUSTDESK_SELF_HOSTED_SETUP.md
  relayServer: "", // e.g., "relay.yourdomain.com" or IP address
  
  // Public key from /opt/rustdesk-server/data/id_ed25519.pub
  // Run: cat /opt/rustdesk-server/data/id_ed25519.pub
  publicKey: "", // e.g., "3b7d0c..."
  
  // RustDesk Pro API server (optional, for enterprise features)
  apiServer: "",
  
  // Auto-install RustDesk when agent enrolls
  autoInstall: true,
  
  // Version to deploy (keep updated)
  rustdeskVersion: "1.2.6",
};

/**
 * Check if remote access is configured
 */
export function isRemoteAccessConfigured(): boolean {
  return Boolean(REMOTE_ACCESS_CONFIG.relayServer);
}

/**
 * Get the RustDesk connection URL for a device
 */
export function getRustDeskConnectionUrl(rustdeskId: string): string {
  return `rustdesk://${rustdeskId}`;
}

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
  rustdesk: {
    id: 'rustdesk',
    name: 'RustDesk',
    icon: '🦀',
    color: 'bg-orange-500',
    description: 'Backup remote desktop (Attended access)',
    protocol: 'rustdesk://',
    isBuiltIn: true,
    isPrimary: false,
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
