import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DOMPurify from 'dompurify';
import { Eye, Download, Save, RefreshCw } from "lucide-react";
import { WhiteLabelConfig } from "@/types/whiteLabel";

interface WhiteLabelPreviewProps {
  config: WhiteLabelConfig;
  loading: boolean;
  onSave: () => void;
}

export const WhiteLabelPreview = ({ config, loading, onSave }: WhiteLabelPreviewProps) => {
  const generatePreviewCSS = () => {
    return `
      :root {
        --primary: ${config.primary_color};
        --secondary: ${config.secondary_color};
        --background: ${config.background_color};
        --foreground: ${config.text_color};
      }
      
      .preview-container {
        background-color: ${config.background_color};
        color: ${config.text_color};
        min-height: 400px;
        padding: 2rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
      }
      
      .preview-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid ${config.primary_color}33;
      }
      
      .preview-logo {
        width: 48px;
        height: 48px;
        border-radius: 0.5rem;
        background: ${config.primary_color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
      }
      
      .preview-button {
        background: ${config.primary_color};
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
      }
      
      .preview-button-secondary {
        background: ${config.secondary_color};
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
      }
      
      ${config.custom_css}
    `;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <style dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatePreviewCSS(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) }} />
          <div className="preview-container">
            <div className="preview-header">
              <div className="preview-logo">
                {config.company_logo ? (
                  <img src={config.company_logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  config.company_name.charAt(0) || 'C'
                )}
              </div>
              <div>
                <h3 className="font-semibold">{config.company_name || 'Company Name'}</h3>
                <p className="text-sm opacity-75">Your AI Assistant Platform</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Sample Interface</h4>
              <button className="preview-button">Primary Button</button>
              <button className="preview-button-secondary">Secondary Button</button>
              
              <div className="mt-4 p-4 rounded border">
                <p className="text-sm">This is how your customized interface will look to your users.</p>
              </div>
              
              <div className="mt-8 pt-4 border-t text-xs opacity-60">
                {config.footer_text}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={onSave} disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
          
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export Theme
          </Button>
          
          <Button variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Deploy Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};