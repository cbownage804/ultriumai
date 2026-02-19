import { useState, useCallback } from 'react';

export interface GalleryConfig {
  columns: number;
  gap: number;
  aspectRatio: 'square' | '4:3' | '16:9' | 'auto';
  borderRadius: number;
  showCaption: boolean;
  lightboxEnabled: boolean;
  hoverEffect: 'none' | 'zoom' | 'overlay' | 'lift';
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  caption: string;
}

export function useGalleryLightboxGenerator() {
  const [config, setConfig] = useState<GalleryConfig>({
    columns: 3,
    gap: 8,
    aspectRatio: 'square',
    borderRadius: 8,
    showCaption: false,
    lightboxEnabled: true,
    hoverEffect: 'zoom',
  });

  const [images, setImages] = useState<GalleryImage[]>([
    { id: '1', url: '/placeholder.svg', alt: 'Image 1', caption: 'First image' },
    { id: '2', url: '/placeholder.svg', alt: 'Image 2', caption: 'Second image' },
    { id: '3', url: '/placeholder.svg', alt: 'Image 3', caption: 'Third image' },
    { id: '4', url: '/placeholder.svg', alt: 'Image 4', caption: 'Fourth image' },
    { id: '5', url: '/placeholder.svg', alt: 'Image 5', caption: 'Fifth image' },
    { id: '6', url: '/placeholder.svg', alt: 'Image 6', caption: 'Sixth image' },
  ]);

  const updateConfig = useCallback((updates: Partial<GalleryConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addImage = useCallback(() => {
    setImages(prev => [...prev, { id: crypto.randomUUID(), url: '/placeholder.svg', alt: '', caption: '' }]);
  }, []);

  const updateImage = useCallback((id: string, updates: Partial<GalleryImage>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const generateCode = useCallback((): string => {
    const aspectClass = config.aspectRatio === 'square' ? 'aspect-square' : config.aspectRatio === '4:3' ? 'aspect-[4/3]' : config.aspectRatio === '16:9' ? 'aspect-video' : '';
    const hoverClass = config.hoverEffect === 'zoom' ? 'group-hover:scale-110 transition-transform duration-300' : config.hoverEffect === 'lift' ? '' : '';
    const liftClass = config.hoverEffect === 'lift' ? 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300' : '';

    return `import { useState, useCallback, useEffect } from 'react';

const IMAGES = ${JSON.stringify(images.map(i => ({ url: i.url, alt: i.alt, caption: i.caption })), null, 2)};

${config.lightboxEnabled ? `function Lightbox({ images, index, onClose }: { images: typeof IMAGES; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors text-white">
        ‹
      </button>
      <div className="max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <img src={images[current].url} alt={images[current].alt} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        ${config.showCaption ? `{images[current].caption && <p className="text-white/80 text-center mt-3 text-sm">{images[current].caption}</p>}` : ''}
      </div>
      <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors text-white">
        ›
      </button>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors text-white">✕</button>
      <div className="absolute bottom-4 text-white/50 text-sm">{current + 1} / {images.length}</div>
    </div>
  );
}
` : ''}
export function ImageGallery() {
  ${config.lightboxEnabled ? 'const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);' : ''}

  return (
    <>
      <div className="grid grid-cols-${config.columns} gap-${config.gap}">
        {IMAGES.map((img, i) => (
          <div
            key={i}
            className="group overflow-hidden ${liftClass} cursor-pointer"
            style={{ borderRadius: '${config.borderRadius}px' }}
            ${config.lightboxEnabled ? 'onClick={() => setLightboxIndex(i)}' : ''}
          >
            <div className="${aspectClass} overflow-hidden bg-muted">
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover ${hoverClass}" loading="lazy" />
              ${config.hoverEffect === 'overlay' ? `<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />` : ''}
            </div>
            ${config.showCaption ? `{img.caption && <p className="text-sm text-muted-foreground mt-1 px-1">{img.caption}</p>}` : ''}
          </div>
        ))}
      </div>
      ${config.lightboxEnabled ? `{lightboxIndex !== null && (
        <Lightbox images={IMAGES} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}` : ''}
    </>
  );
}`;
  }, [config, images]);

  return { config, images, updateConfig, addImage, updateImage, removeImage, generateCode };
}
