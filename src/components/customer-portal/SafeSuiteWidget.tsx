/**
 * SafeSuite Widget Component
 * Renders SafeSuite tools in the portal dashboard
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Search, Globe, Shield, ExternalLink, Lock, Scan, Wifi, MapPin } from 'lucide-react';

interface SafeSuiteAccess {
  safepass_enabled: boolean;
  safescan_enabled: boolean;
  safeweb_enabled: boolean;
  safetrack_enabled: boolean;
}

interface SafeSuiteWidgetProps {
  access: SafeSuiteAccess;
}

export function SafeSuiteWidget({ access }: SafeSuiteWidgetProps) {
  const tools = [
    {
      id: 'safepass',
      enabled: access.safepass_enabled,
      title: 'SafePass',
      description: 'Secure password vault for your team',
      icon: Key,
      color: 'from-cyan-500 to-blue-600',
      features: ['Password Storage', 'Auto-fill', 'Sharing'],
      url: '/safepass'
    },
    {
      id: 'safescan',
      enabled: access.safescan_enabled,
      title: 'SafeScan',
      description: 'Security vulnerability scanner',
      icon: Scan,
      color: 'from-purple-500 to-pink-600',
      features: ['Breach Monitoring', 'Email Scan', 'Dark Web'],
      url: '/safescan'
    },
    {
      id: 'safeweb',
      enabled: access.safeweb_enabled,
      title: 'SafeWeb',
      description: 'Secure browsing and VPN protection',
      icon: Wifi,
      color: 'from-green-500 to-teal-600',
      features: ['VPN Access', 'Safe Browsing', 'Tracking Protection'],
      url: '/safeweb'
    },
    {
      id: 'safetrack',
      enabled: access.safetrack_enabled,
      title: 'SafeTrack',
      description: 'Asset warranty and location tracking',
      icon: MapPin,
      color: 'from-amber-500 to-orange-600',
      features: ['Warranty Lookup', 'Asset Tracking', 'Reminders'],
      url: '/safetrack'
    }
  ];

  const enabledTools = tools.filter(t => t.enabled);

  if (enabledTools.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Security Tools</h2>
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          SafeSuite
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enabledTools.map(tool => (
          <Card 
            key={tool.id}
            className="bg-black/40 border-white/10 hover:border-cyan-500/30 transition-all group cursor-pointer"
            onClick={() => window.open(tool.url, '_blank')}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {tool.title}
                    </h3>
                    <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <p className="text-sm text-white/60 mb-2">{tool.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {tool.features.map((feature, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-[10px] border-white/10 text-white/40"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Locked Tool placeholder for tools not enabled
 */
export function LockedTool({ name }: { name: string }) {
  return (
    <Card className="bg-black/20 border-white/5">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
          <Lock className="h-5 w-5 text-white/30" />
        </div>
        <div>
          <h3 className="font-medium text-white/40">{name}</h3>
          <p className="text-xs text-white/30">Contact your administrator to enable</p>
        </div>
      </CardContent>
    </Card>
  );
}
