import { useEffect, useRef, useState } from 'react';

export const useScrollRotation = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;
      
      // Calculate visibility and rotation progress
      const elementCenter = elementTop + elementHeight / 2;
      const viewportCenter = viewportHeight / 2;
      
      // Calculate rotation based on position relative to viewport center
      const distanceFromCenter = elementCenter - viewportCenter;
      const maxDistance = viewportHeight / 2 + elementHeight / 2;
      
      // Normalize to -1 to 1 range
      const normalizedDistance = Math.max(-1, Math.min(1, distanceFromCenter / maxDistance));
      
      // Convert to rotation angle (max 45 degrees)
      const rotationAngle = normalizedDistance * 45;
      
      setScrollProgress(rotationAngle);
      setIsVisible(Math.abs(normalizedDistance) < 1.2); // Slightly more forgiving visibility
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { ref, scrollProgress, isVisible };
};

export const useAccordionRotation = () => {
  const [rotationY, setRotationY] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate rotation based on element position
      const elementTop = rect.top;
      const elementBottom = rect.bottom;
      
      let rotation = 0;
      let opacityValue = 1;
      
      // Element is above viewport (scrolled past)
      if (elementBottom < 0) {
        rotation = -30; // Rotate left when scrolled past
        opacityValue = 0.7;
      }
      // Element is below viewport (not reached yet)
      else if (elementTop > viewportHeight) {
        rotation = 30; // Rotate right when approaching
        opacityValue = 0.7;
      }
      // Element is in viewport
      else {
        // Calculate smooth transition based on position in viewport
        const visibleHeight = Math.min(elementBottom, viewportHeight) - Math.max(elementTop, 0);
        const elementHeight = rect.height;
        const visibilityRatio = visibleHeight / elementHeight;
        
        rotation = 0;
        opacityValue = 0.7 + (visibilityRatio * 0.3); // 0.7 to 1.0 opacity
      }
      
      setRotationY(rotation);
      setOpacity(opacityValue);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { ref, rotationY, opacity };
};

export const useSectionRotation = () => {
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, opacity: 1 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;
      
      // Calculate progress through viewport
      const enterProgress = Math.max(0, Math.min(1, (viewportHeight - elementTop) / viewportHeight));
      const exitProgress = Math.max(0, Math.min(1, (elementTop + elementHeight) / viewportHeight));
      
      let rotateX = 0;
      let rotateY = 0;
      let opacity = 1;
      
      // Element entering from bottom
      if (elementTop > viewportHeight * 0.2) {
        rotateX = (1 - enterProgress) * 20; // Rotate from 20deg to 0deg
        opacity = 0.5 + (enterProgress * 0.5); // Fade from 0.5 to 1
      }
      // Element exiting from top
      else if (elementTop < -elementHeight * 0.2) {
        rotateX = -exitProgress * 20; // Rotate from 0deg to -20deg
        opacity = exitProgress * 0.5 + 0.5; // Fade from 1 to 0.5
      }
      
      setTransform({ rotateX, rotateY, opacity });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { ref, transform };
};