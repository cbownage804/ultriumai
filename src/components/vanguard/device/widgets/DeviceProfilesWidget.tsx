import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, ExternalLink, Shield, Zap, FileCode } from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  id: string;
  name: string;
  type: 'threshold' | 'automation' | 'configuration';
  description?: string;
}

interface DeviceProfilesWidgetProps {
  thresholdProfile?: Profile | null;
  automationProfiles: Profile[];
  configurationPolicy?: Profile | null;
  onManageProfiles: () => void;
}

export function DeviceProfilesWidget({
  thresholdProfile,
  automationProfiles,
  configurationPolicy,
  onManageProfiles,
}: DeviceProfilesWidgetProps) {
  return (
    <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-purple-500/10">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-white/60">Profiles</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white hover:bg-cyan-500/10" onClick={onManageProfiles}>
          <Settings className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Threshold Profile */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Shield className="h-3 w-3" />
            Threshold profile
          </div>
          {thresholdProfile ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-400 hover:underline cursor-pointer">
                {thresholdProfile.name}
              </span>
              <ExternalLink className="h-3 w-3 text-white/40" />
            </div>
          ) : (
            <p className="text-sm text-white/40">No threshold profile assigned</p>
          )}
        </div>
        
        {/* Automation Profiles */}
        <div className="space-y-1 pt-2 border-t border-cyan-500/20">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Zap className="h-3 w-3" />
            IT Automation profiles
          </div>
          {automationProfiles.length > 0 ? (
            <div className="space-y-1">
              {automationProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between">
                  <span className="text-sm text-cyan-400 hover:underline cursor-pointer">
                    {profile.name}
                  </span>
                  <ExternalLink className="h-3 w-3 text-white/40" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">No automation profiles assigned</p>
          )}
        </div>
        
        {/* Configuration Policy */}
        <div className="space-y-1 pt-2 border-t border-cyan-500/20">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <FileCode className="h-3 w-3" />
            Configuration policy
          </div>
          {configurationPolicy ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-400 hover:underline cursor-pointer">
                {configurationPolicy.name}
              </span>
              <ExternalLink className="h-3 w-3 text-white/40" />
            </div>
          ) : (
            <p className="text-sm text-white/40">No configuration policy assigned</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
