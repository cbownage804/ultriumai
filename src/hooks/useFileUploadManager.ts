import { useState, useCallback } from 'react';

export interface UploadConfig {
  id: string;
  name: string;
  bucket: string;
  maxSizeMB: number;
  allowedTypes: string[];
  isPublic: boolean;
  generateThumbnails: boolean;
  maxFiles: number;
}

export interface UploadPreview {
  id: string;
  configId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl: string | null;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

export function useFileUploadManager() {
  const [configs, setConfigs] = useState<UploadConfig[]>([]);
  const [previews, setPreviews] = useState<UploadPreview[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);

  const MIME_PRESETS: Record<string, string[]> = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    videos: ['video/mp4', 'video/webm', 'video/ogg'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    all: ['*/*'],
  };

  const createConfig = useCallback((name: string) => {
    const config: UploadConfig = {
      id: crypto.randomUUID(), name, bucket: name.toLowerCase().replace(/\s+/g, '-'),
      maxSizeMB: 10, allowedTypes: MIME_PRESETS.images, isPublic: false, generateThumbnails: true, maxFiles: 5,
    };
    setConfigs(prev => [...prev, config]);
    setActiveConfigId(config.id);
  }, []);

  const updateConfig = useCallback((id: string, update: Partial<UploadConfig>) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...update } : c));
  }, []);

  const removeConfig = useCallback((id: string) => {
    setConfigs(prev => prev.filter(c => c.id !== id));
    setPreviews(prev => prev.filter(p => p.configId !== id));
  }, []);

  const simulateUpload = useCallback((configId: string, fileName: string) => {
    const preview: UploadPreview = {
      id: crypto.randomUUID(), configId, fileName, fileSize: Math.floor(Math.random() * 5000000),
      mimeType: 'image/png', previewUrl: null, status: 'uploading', progress: 0,
    };
    setPreviews(prev => [preview, ...prev]);
    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        clearInterval(interval);
        setPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, status: 'success', progress: 100 } : p));
      } else {
        setPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, progress: Math.min(99, progress) } : p));
      }
    }, 400);
  }, []);

  const clearPreviews = useCallback(() => setPreviews([]), []);

  const getActiveConfig = useCallback(() => configs.find(c => c.id === activeConfigId) || null, [configs, activeConfigId]);

  const generateStoragePolicy = useCallback((configId: string): string => {
    const config = configs.find(c => c.id === configId);
    if (!config) return '';
    return `-- Storage bucket & policies for "${config.name}"
INSERT INTO storage.buckets (id, name, public) VALUES ('${config.bucket}', '${config.bucket}', ${config.isPublic});

${config.isPublic ? `CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = '${config.bucket}');` : ''}

CREATE POLICY "Auth upload" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = '${config.bucket}' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth update own" ON storage.objects FOR UPDATE
USING (bucket_id = '${config.bucket}' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth delete own" ON storage.objects FOR DELETE
USING (bucket_id = '${config.bucket}' AND auth.uid()::text = (storage.foldername(name))[1]);`;
  }, [configs]);

  const generateUploadComponent = useCallback((configId: string): string => {
    const config = configs.find(c => c.id === configId);
    if (!config) return '';
    return `import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function ${config.name.replace(/\s+/g, '')}Upload() {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleUpload = useCallback(async (file: File) => {
    if (file.size > ${config.maxSizeMB} * 1024 * 1024) {
      alert('File too large. Max ${config.maxSizeMB}MB.');
      return;
    }
    setUploading(true);
    const path = \`\${(await supabase.auth.getUser()).data.user?.id}/\${Date.now()}-\${file.name}\`;
    const { error } = await supabase.storage.from('${config.bucket}').upload(path, file);
    setUploading(false);
    if (error) console.error(error);
  }, []);

  return (
    <div>
      <input
        type="file"
        accept="${config.allowedTypes.join(',')}"
        ${config.maxFiles > 1 ? 'multiple' : ''}
        onChange={(e) => {
          const selected = Array.from(e.target.files || []).slice(0, ${config.maxFiles});
          selected.forEach(handleUpload);
        }}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}`;
  }, [configs]);

  return {
    configs, previews, activeConfigId, setActiveConfigId, getActiveConfig, MIME_PRESETS,
    createConfig, updateConfig, removeConfig, simulateUpload, clearPreviews,
    generateStoragePolicy, generateUploadComponent,
  };
}
