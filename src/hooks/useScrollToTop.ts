import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that scrolls to the top of the page when the route changes
 * This ensures all page navigations start at the top
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top whenever the pathname changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
};

/**
 * Navigation utility function that handles both page and section navigation
 * @param navigate - React Router navigate function
 * @param path - The path to navigate to (can be a page path or section hash)
 */
export const createNavigationHandler = (navigate: (path: string) => void) => {
  return (path: string) => {
    if (path.startsWith('#')) {
      // Handle section navigation within the same page
      const element = document.querySelector(path);
      if (element) {
        const navHeight = 64; // Navigation bar height (h-16 = 64px)
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: elementTop, behavior: 'smooth' });
      }
    } else {
      // Handle page navigation
      navigate(path);
      // Scroll to top after navigation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    }
  };
};