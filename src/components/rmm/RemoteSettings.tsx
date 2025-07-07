import { Settings } from "lucide-react";

interface RemoteSettingsProps {
  sessionId: string;
  deviceName: string;
  quality: 'high' | 'medium' | 'low';
  isPaused: boolean;
  onQualityChange: (quality: 'high' | 'medium' | 'low') => void;
}

export const RemoteSettings = ({ 
  sessionId, 
  deviceName, 
  quality, 
  isPaused, 
  onQualityChange 
}: RemoteSettingsProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Display Settings
        </h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Video Quality</label>
          <select 
            value={quality} 
            onChange={(e) => onQualityChange(e.target.value as any)}
            className="w-full p-2 border rounded"
          >
            <option value="high">High (Best quality, more bandwidth)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="low">Low (Faster, less bandwidth)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Session Info</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Device:</strong> {deviceName}</p>
          <p><strong>Session ID:</strong> {sessionId}</p>
          <p><strong>Quality:</strong> {quality}</p>
          <p><strong>Status:</strong> {isPaused ? 'Paused' : 'Active'}</p>
        </div>
      </div>
    </div>
  );
};