import { useState, useCallback } from 'react';

export interface OptimizedImage {
  id: string;
  originalName: string;
  originalSize: number;
  optimizedSize: number;
  format: 'webp' | 'jpeg' | 'png';
  width: number;
  height: number;
  srcset: string;
  dataUrl: string;
  savings: number;
}

export function useImageOptimizer() {
  const [images, setImages] = useState<OptimizedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const optimizeImage = useCallback(async (file: File): Promise<OptimizedImage> => {
    setIsProcessing(true);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const webpUrl = canvas.toDataURL('image/webp', 0.85);
          const optimizedSize = Math.round(webpUrl.length * 0.75);

          const breakpoints = [320, 640, 768, 1024, 1200];
          const srcset = breakpoints
            .filter(bp => bp <= canvas.width)
            .map(bp => `image-${bp}w.webp ${bp}w`)
            .join(', ');

          const result: OptimizedImage = {
            id: crypto.randomUUID(),
            originalName: file.name,
            originalSize: file.size,
            optimizedSize,
            format: 'webp',
            width: canvas.width,
            height: canvas.height,
            srcset,
            dataUrl: webpUrl,
            savings: Math.round((1 - optimizedSize / file.size) * 100),
          };

          setImages(prev => [...prev, result]);
          setIsProcessing(false);
          resolve(result);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const generateImgTag = useCallback((image: OptimizedImage): string => {
    return `<img\n  src="${image.originalName.replace(/\.[^.]+$/, '.webp')}"\n  srcset="${image.srcset}"\n  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"\n  width="${image.width}"\n  height="${image.height}"\n  alt="${image.originalName.replace(/\.[^.]+$/, '')}"\n  loading="lazy"\n  decoding="async"\n/>`;
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(i => i.id !== id));
  }, []);

  return { images, isProcessing, optimizeImage, generateImgTag, removeImage };
}
