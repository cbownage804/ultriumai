import { useState, useCallback } from 'react';

export interface CarouselConfig {
  autoplay: boolean;
  autoplayDelay: number;
  loop: boolean;
  showDots: boolean;
  showArrows: boolean;
  slidesPerView: number;
  gap: number;
  align: 'start' | 'center' | 'end';
}

export interface CarouselSlide {
  id: string;
  type: 'image' | 'content';
  imageUrl: string;
  title: string;
  description: string;
}

export function useCarouselBuilder() {
  const [config, setConfig] = useState<CarouselConfig>({
    autoplay: false,
    autoplayDelay: 4000,
    loop: true,
    showDots: true,
    showArrows: true,
    slidesPerView: 1,
    gap: 16,
    align: 'start',
  });

  const [slides, setSlides] = useState<CarouselSlide[]>([
    { id: '1', type: 'image', imageUrl: '/placeholder.svg', title: 'Slide 1', description: 'First slide description' },
    { id: '2', type: 'image', imageUrl: '/placeholder.svg', title: 'Slide 2', description: 'Second slide description' },
    { id: '3', type: 'image', imageUrl: '/placeholder.svg', title: 'Slide 3', description: 'Third slide description' },
  ]);

  const updateConfig = useCallback((updates: Partial<CarouselConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addSlide = useCallback(() => {
    setSlides(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'image',
      imageUrl: '/placeholder.svg',
      title: `Slide ${prev.length + 1}`,
      description: '',
    }]);
  }, []);

  const updateSlide = useCallback((id: string, updates: Partial<CarouselSlide>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeSlide = useCallback((id: string) => {
    setSlides(prev => prev.filter(s => s.id !== id));
  }, []);

  const generateCode = useCallback((): string => {
    const autoplayImport = config.autoplay ? "\nimport Autoplay from 'embla-carousel-autoplay';" : '';
    const pluginsArr = config.autoplay ? `[Autoplay({ delay: ${config.autoplayDelay} })]` : '[]';

    return `import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';${autoplayImport}

const SLIDES = ${JSON.stringify(slides.map(s => ({ imageUrl: s.imageUrl, title: s.title, description: s.description })), null, 2)};

export function ImageCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: ${config.loop}, align: '${config.align}', slidesToScroll: 1 },
    ${pluginsArr}
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  return (
    <div className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" style={{ gap: '${config.gap}px' }}>
          {SLIDES.map((slide, i) => (
            <div key={i} className="flex-[0_0_${config.slidesPerView === 1 ? '100' : Math.floor(100 / config.slidesPerView)}%] min-w-0">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                {slide.title && (
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="text-white font-semibold">{slide.title}</h3>
                    {slide.description && <p className="text-white/80 text-sm">{slide.description}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
${config.showArrows ? `      <button onClick={scrollPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow hover:bg-background transition-colors" aria-label="Previous">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button onClick={scrollNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow hover:bg-background transition-colors" aria-label="Next">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>` : ''}
${config.showDots ? `      <div className="flex justify-center gap-2 mt-4">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => scrollTo(i)} className={\`w-2.5 h-2.5 rounded-full transition-colors \${i === selectedIndex ? 'bg-primary' : 'bg-muted-foreground/30'}\`} aria-label={\`Go to slide \${i + 1}\`} />
        ))}
      </div>` : ''}
    </div>
  );
}`;
  }, [config, slides]);

  return { config, slides, updateConfig, addSlide, updateSlide, removeSlide, generateCode };
}
