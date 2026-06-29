import { useState, useEffect } from 'react';
import { safeWindowOpen } from '@/utils/security';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Shield, 
  Key, 
  Eye,
  EyeOff,
  Copy,
  Settings,
  Users,
  Plus,
  Check
} from "lucide-react";

interface VaultEmbedProps {
  tenantId: string;
  brandName?: string;
  primaryColor?: string;
  apiEndpoint?: string;
  onCredentialsDetected?: (credentials: any[]) => void;
}

interface SavedCredential {
  id: string;
  name: string;
  website: string;
  username: string;
  password: string; // Would be encrypted in real implementation
}

export const VaultEmbed = ({ 
  tenantId, 
  brandName = 'Vault', 
  primaryColor = '#3b82f6',
  apiEndpoint = 'https://safepass.ultriumai.com/api',
  onCredentialsDetected
}: VaultEmbedProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [detectedForms, setDetectedForms] = useState<HTMLFormElement[]>([]);
  const [showCreateCredential, setShowCreateCredential] = useState(false);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock saved credentials for demo
  const mockCredentials: SavedCredential[] = [
    {
      id: '1',
      name: 'Company Email',
      website: window.location.hostname,
      username: 'john@company.com',
      password: 'SecurePass123!'
    },
    {
      id: '2', 
      name: 'Admin Portal',
      website: window.location.hostname,
      username: 'admin@company.com',
      password: 'AdminPass456!'
    },
    {
      id: '3',
      name: 'User Account',
      website: window.location.hostname,
      username: 'user@company.com',
      password: 'UserPass789!'
    }
  ];

  // Auto-detect login forms on page
  useEffect(() => {
    const detectForms = () => {
      const forms = Array.from(document.querySelectorAll('form')).filter(form => {
        const hasPasswordField = form.querySelector('input[type="password"]');
        const hasEmailField = form.querySelector('input[type="email"], input[name*="email"], input[name*="username"]');
        return hasPasswordField && hasEmailField;
      });
      
      setDetectedForms(forms as HTMLFormElement[]);
      
      if (forms.length > 0) {
        setCredentials(mockCredentials);
        onCredentialsDetected?.(mockCredentials);
      }
    };

    // Initial detection
    detectForms();
    
    // Re-detect when DOM changes
    const observer = new MutationObserver(detectForms);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [onCredentialsDetected]);

  // Auto-fill form with selected credentials
  const fillCredentials = (credential: SavedCredential) => {
    const form = detectedForms[0]; // Use first form for demo
    if (!form) return;

    const emailField = form.querySelector('input[type="email"], input[name*="email"], input[name*="username"]') as HTMLInputElement;
    const passwordField = form.querySelector('input[type="password"]') as HTMLInputElement;

    if (emailField) {
      emailField.value = credential.username;
      emailField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (passwordField) {
      passwordField.value = credential.password;
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setIsOpen(false);
    
    // Show success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: ${primaryColor}; 
        color: white; 
        padding: 12px 16px; 
        border-radius: 6px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    // Create SVG element safely
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '20,6 9,17 4,12');
    svg.appendChild(polyline);
    
    notification.appendChild(svg);
    notification.appendChild(document.createTextNode('Credentials filled successfully!'));
    
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 3000);
  };

  // Don't render if no forms detected
  if (detectedForms.length === 0) return null;

  return (
    <>
      {/* Floating Widget Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10000,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          <Shield className="h-6 w-6" />
        </Button>
        
        {credentials.length > 0 && (
          <Badge 
            className="absolute -top-2 -left-2 bg-green-500 text-white animate-pulse"
          >
            {credentials.length}
          </Badge>
        )}
      </div>

      {/* Widget Panel */}
      {isOpen && (
        <Card
          className="fixed bottom-20 right-5 w-80 shadow-2xl border-2 z-10000"
          style={{
            zIndex: 10000,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderColor: primaryColor + '40'
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" style={{ color: primaryColor }} />
                <span className="font-semibold text-sm">{brandName}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>

            <div className="space-y-3">
              {/* Detection Status */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 text-sm">
                  <Check className="h-4 w-4" />
                  <span>Login form detected</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {credentials.length} saved credentials available
                </div>
              </div>

              {/* Saved Credentials */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Available Credentials:
                </div>
                {credentials.map((cred) => (
                  <div 
                    key={cred.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => fillCredentials(cred)}
                  >
                    <div>
                      <div className="text-sm font-medium">{cred.name}</div>
                      <div className="text-xs text-gray-500">{cred.username}</div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 px-2">
                      <Key className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={() => setShowCreateCredential(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Save New
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={() => safeWindowOpen(`${apiEndpoint}/manage/${tenantId}`, '_blank')}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </div>

              {/* Branding */}
              <div className="text-center pt-2 border-t">
                <div className="text-xs text-gray-400">
                  Secured by {brandName}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Credential Dialog */}
      <Dialog open={showCreateCredential} onOpenChange={setShowCreateCredential}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save New Credential</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name (e.g., Work Email)" />
            <Input placeholder="Username or Email" />
            <Input type="password" placeholder="Password" />
            <Button className="w-full" style={{ backgroundColor: primaryColor }}>
              Save Credential
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};