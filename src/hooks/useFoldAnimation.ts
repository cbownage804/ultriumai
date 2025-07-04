import { useEffect, useRef, useState } from 'react';

export const useFoldAnimation = () => {
  const [foldState, setFoldState] = useState<'normal' | 'folding' | 'folded'>('normal');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;
      
      // Calculate fold progress based on scroll position
      const foldStart = viewportHeight * 0.3; // Start folding when 30% visible
      const foldComplete = -elementHeight * 0.3; // Complete fold when 30% past viewport
      
      if (elementTop > foldStart) {
        setFoldState('normal');
      } else if (elementTop > foldComplete) {
        setFoldState('folding');
      } else {
        setFoldState('folded');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { ref, foldState };
};

export const useAccordionFold = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [foldDirection, setFoldDirection] = useState<'up' | 'down' | 'normal'>('normal');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const rect = entry.boundingClientRect;
        const viewportHeight = window.innerHeight;
        
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Determine fold direction based on position
          if (rect.top < viewportHeight * 0.2) {
            setFoldDirection('up');
          } else if (rect.bottom > viewportHeight * 0.8) {
            setFoldDirection('down');
          } else {
            setFoldDirection('normal');
          }
        } else {
          setIsVisible(false);
          if (rect.top < 0) {
            setFoldDirection('up');
          } else {
            setFoldDirection('down');
          }
        }
      },
      { 
        threshold: [0, 0.1, 0.5, 0.9, 1],
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible, foldDirection };
};

export const usePaperFold = () => {
  const [isActive, setIsActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Activate paper fold when element is about to leave viewport
      const shouldActivate = rect.top < viewportHeight * 0.1 && rect.bottom > 0;
      setIsActive(shouldActivate);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { ref, isActive };
};