import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Play, Save, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScriptParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
  defaultValue?: string;
}

interface ScriptEditorProps {
  trigger?: React.ReactNode;
  onSave?: (script: any) => void;
}

export const ScriptEditor = ({ trigger, onSave }: ScriptEditorProps) => {
  const [open, setOpen] = useState(false);
  const [script, setScript] = useState({
    name: '',
    description: '',
    script_type: 'powershell' as const,
    script_content: '',
    category: 'custom',
    execution_timeout: 300,
    requires_elevation: false,
    tags: [] as string[],
    parameters: [] as ScriptParameter[]
  });
  const [currentTag, setCurrentTag] = useState('');
  const { toast } = useToast();

  const scriptTemplates = {
    powershell: `# PowerShell Script Template
# Description: Enter your script description here

param(
    [Parameter(Mandatory=$false)]
    [string]$ComputerName = $env:COMPUTERNAME
)

try {
    # Your PowerShell code here
    Write-Host "Starting script execution on $ComputerName"
    
    # Example: Get system information
    Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory
    
    Write-Host "Script completed successfully"
    exit 0
}
catch {
    Write-Error "Script failed: $($_.Exception.Message)"
    exit 1
}`,
    
    batch: `@echo off
REM Batch Script Template
REM Description: Enter your script description here

echo Starting script execution...

REM Your batch commands here
systeminfo | findstr /C:"OS Name" /C:"OS Version" /C:"System Type"

if %errorlevel% equ 0 (
    echo Script completed successfully
    exit /b 0
) else (
    echo Script failed with error code %errorlevel%
    exit /b 1
)`,

    python: `#!/usr/bin/env python3
"""
Python Script Template
Description: Enter your script description here
"""

import sys
import platform
import subprocess

def main():
    """Main script function"""
    try:
        print("Starting script execution...")
        
        # Your Python code here
        print(f"OS: {platform.system()} {platform.release()}")
        print(f"Python: {platform.python_version()}")
        
        print("Script completed successfully")
        return 0
    except Exception as e:
        print(f"Script failed: {str(e)}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())`,

    bash: `#!/bin/bash
# Bash Script Template
# Description: Enter your script description here

set -e  # Exit on any error

echo "Starting script execution..."

# Your bash commands here
uname -a
df -h

echo "Script completed successfully"
exit 0`
  };

  const handleSave = () => {
    if (!script.name.trim() || !script.script_content.trim()) {
      toast({
        title: "Validation Error",
        description: "Script name and content are required",
        variant: "destructive"
      });
      return;
    }

    onSave?.(script);
    toast({
      title: "Script Saved",
      description: `${script.name} has been saved successfully`
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setScript({
      name: '',
      description: '',
      script_type: 'powershell',
      script_content: '',
      category: 'custom',
      execution_timeout: 300,
      requires_elevation: false,
      tags: [],
      parameters: []
    });
    setCurrentTag('');
  };

  const addTag = () => {
    if (currentTag.trim() && !script.tags.includes(currentTag.trim())) {
      setScript(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setScript(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addParameter = () => {
    setScript(prev => ({
      ...prev,
      parameters: [...prev.parameters, {
        name: '',
        type: 'string',
        description: '',
        required: false
      }]
    }));
  };

  const updateParameter = (index: number, field: keyof ScriptParameter, value: any) => {
    setScript(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const removeParameter = (index: number) => {
    setScript(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const loadTemplate = () => {
    setScript(prev => ({
      ...prev,
      script_content: scriptTemplates[prev.script_type]
    }));
    toast({
      title: "Template Loaded",
      description: `${script.script_type} template has been loaded`
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-primary to-primary/90">
            <Code2 className="h-4 w-4 mr-2" />
            Create Script
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Script Editor
          </DialogTitle>
          <DialogDescription>
            Create and configure custom automation scripts for your RMM agents
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Script Configuration */}
          <div className="lg:col-span-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Script Name *</Label>
              <Input
                id="name"
                value={script.name}
                onChange={(e) => setScript(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter script name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={script.description}
                onChange={(e) => setScript(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What does this script do?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="script_type">Script Type</Label>
              <Select
                value={script.script_type}
                onValueChange={(value: any) => setScript(prev => ({ ...prev, script_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="powershell">PowerShell</SelectItem>
                  <SelectItem value="batch">Batch</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="bash">Bash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={script.category}
                onValueChange={(value) => setScript(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="deployment">Deployment</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Execution Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={script.execution_timeout}
                onChange={(e) => setScript(prev => ({ ...prev, execution_timeout: parseInt(e.target.value) || 300 }))}
                min={30}
                max={3600}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="elevation"
                checked={script.requires_elevation}
                onCheckedChange={(checked) => setScript(prev => ({ ...prev, requires_elevation: checked }))}
              />
              <Label htmlFor="elevation">Requires Elevation</Label>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {script.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Script Content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Script Content *</Label>
              <Button size="sm" variant="outline" onClick={loadTemplate}>
                Load Template
              </Button>
            </div>
            <Textarea
              id="content"
              value={script.script_content}
              onChange={(e) => setScript(prev => ({ ...prev, script_content: e.target.value }))}
              placeholder="Enter your script content here..."
              rows={20}
              className="font-mono text-sm"
            />

            <Separator />

            {/* Parameters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Script Parameters</Label>
                <Button size="sm" variant="outline" onClick={addParameter}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Parameter
                </Button>
              </div>

              {script.parameters.map((param, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Parameter {index + 1}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeParameter(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Parameter name"
                      value={param.name}
                      onChange={(e) => updateParameter(index, 'name', e.target.value)}
                    />
                    <Select
                      value={param.type}
                      onValueChange={(value: any) => updateParameter(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Description"
                    value={param.description}
                    onChange={(e) => updateParameter(index, 'description', e.target.value)}
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={param.required}
                      onCheckedChange={(checked) => updateParameter(index, 'required', checked)}
                    />
                    <Label className="text-sm">Required</Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Script
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};