import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  delay?: number;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', once = true, delay = 0 } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!once || !hasTriggered)) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              setHasTriggered(true);
            }, delay);
          } else {
            setIsVisible(true);
            setHasTriggered(true);
          }
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once && !entry.isIntersecting) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, once, delay, hasTriggered]);

  return { ref, isVisible };
};

// Animation variants helper
export const getAnimationClasses = (isVisible: boolean, variant: string = 'fadeUp') => {
  const baseClasses = 'transition-all duration-700 ease-out';
  
  const variants = {
    fadeUp: isVisible 
      ? `${baseClasses} opacity-100 translate-y-0` 
      : `${baseClasses} opacity-0 translate-y-8`,
    fadeDown: isVisible 
      ? `${baseClasses} opacity-100 translate-y-0` 
      : `${baseClasses} opacity-0 -translate-y-8`,
    fadeLeft: isVisible 
      ? `${baseClasses} opacity-100 translate-x-0` 
      : `${baseClasses} opacity-0 translate-x-8`,
    fadeRight: isVisible 
      ? `${baseClasses} opacity-100 translate-x-0` 
      : `${baseClasses} opacity-0 -translate-x-8`,
    scale: isVisible 
      ? `${baseClasses} opacity-100 scale-100` 
      : `${baseClasses} opacity-0 scale-95`,
    slideUp: isVisible 
      ? `${baseClasses} opacity-100 translate-y-0` 
      : `${baseClasses} opacity-0 translate-y-16`,
    slideLeft: isVisible 
      ? `${baseClasses} opacity-100 translate-x-0` 
      : `${baseClasses} opacity-0 translate-x-16`,
    slideRight: isVisible 
      ? `${baseClasses} opacity-100 translate-x-0` 
      : `${baseClasses} opacity-0 -translate-x-16`
  };

  return variants[variant as keyof typeof variants] || variants.fadeUp;
};

export const useStaggeredScrollAnimation = (count: number, delay: number = 150) => {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(count).fill(false));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Trigger staggered animations
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              setVisibleItems(prev => {
                const newState = [...prev];
                newState[i] = true;
                return newState;
              });
            }, i * delay);
          }
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [count, delay]);

  return { ref, visibleItems };
};