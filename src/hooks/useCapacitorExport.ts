import { useState, useCallback } from 'react';

export interface CapacitorPlatformConfig {
  appId: string;
  appName: string;
  platforms: ('ios' | 'android')[];
  splashColor: string;
  iconUrl: string;
  statusBarStyle: 'default' | 'light' | 'dark';
  orientation: 'portrait' | 'landscape' | 'any';
  permissions: string[];
}

export interface CapacitorExportResult {
  capacitorConfig: string;
  packageJsonPatch: string;
  appDelegateNotes: string;
  androidManifestNotes: string;
}

const DEFAULT_CONFIG: CapacitorPlatformConfig = {
  appId: 'com.example.app',
  appName: 'My App',
  platforms: ['ios', 'android'],
  splashColor: '#ffffff',
  iconUrl: '',
  statusBarStyle: 'default',
  orientation: 'portrait',
  permissions: [],
};

const AVAILABLE_PERMISSIONS = [
  'camera', 'geolocation', 'push-notifications',
  'filesystem', 'haptics', 'network', 'device',
  'share', 'clipboard', 'app-launcher',
];

export function useCapacitorExport() {
  const [config, setConfig] = useState<CapacitorPlatformConfig>(DEFAULT_CONFIG);
  const [exportResult, setExportResult] = useState<CapacitorExportResult | null>(null);

  const updateConfig = useCallback((partial: Partial<CapacitorPlatformConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const togglePlatform = useCallback((platform: 'ios' | 'android') => {
    setConfig(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  }, []);

  const togglePermission = useCallback((perm: string) => {
    setConfig(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  }, []);

  const generateExport = useCallback(() => {
    const capacitorConfig = JSON.stringify({
      appId: config.appId,
      appName: config.appName,
      webDir: 'dist',
      bundledWebRuntime: false,
      plugins: {
        SplashScreen: { launchShowDuration: 2000, backgroundColor: config.splashColor },
        StatusBar: { style: config.statusBarStyle },
        ...(config.permissions.includes('push-notifications') ? { PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] } } : {}),
      },
      ios: config.platforms.includes('ios') ? { scheme: config.appName.replace(/\s/g, '') } : undefined,
      android: config.platforms.includes('android') ? { allowMixedContent: true } : undefined,
    }, null, 2);

    const packageJsonPatch = JSON.stringify({
      scripts: {
        'cap:init': 'npx cap init',
        'cap:sync': 'npx cap sync',
        'cap:open:ios': 'npx cap open ios',
        'cap:open:android': 'npx cap open android',
        'cap:build': 'npm run build && npx cap sync',
      },
      dependencies: {
        '@capacitor/core': '^7.0.0',
        '@capacitor/cli': '^7.0.0',
        ...(config.permissions.includes('camera') ? { '@capacitor/camera': '^7.0.0' } : {}),
        ...(config.permissions.includes('geolocation') ? { '@capacitor/geolocation': '^7.0.0' } : {}),
        ...(config.permissions.includes('push-notifications') ? { '@capacitor/push-notifications': '^7.0.0' } : {}),
        ...(config.permissions.includes('haptics') ? { '@capacitor/haptics': '^7.0.0' } : {}),
        ...(config.permissions.includes('network') ? { '@capacitor/network': '^7.0.0' } : {}),
        ...(config.permissions.includes('device') ? { '@capacitor/device': '^7.0.0' } : {}),
      },
    }, null, 2);

    const appDelegateNotes = config.platforms.includes('ios')
      ? `// iOS Setup:\n// 1. npx cap add ios\n// 2. Open in Xcode: npx cap open ios\n// 3. Set Bundle Identifier to: ${config.appId}\n// 4. Configure signing & capabilities\n// 5. Add app icons to Assets.xcassets`
      : 'iOS platform not selected.';

    const androidManifestNotes = config.platforms.includes('android')
      ? `// Android Setup:\n// 1. npx cap add android\n// 2. Open in Android Studio: npx cap open android\n// 3. Update applicationId in build.gradle: "${config.appId}"\n// 4. Add icons to res/mipmap-*\n// 5. Configure permissions in AndroidManifest.xml`
      : 'Android platform not selected.';

    setExportResult({ capacitorConfig, packageJsonPatch, appDelegateNotes, androidManifestNotes });
    return { capacitorConfig, packageJsonPatch, appDelegateNotes, androidManifestNotes };
  }, [config]);

  return {
    config, updateConfig, togglePlatform, togglePermission,
    exportResult, generateExport,
    availablePermissions: AVAILABLE_PERMISSIONS,
  };
}
