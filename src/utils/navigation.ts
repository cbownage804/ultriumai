/**
 * Utility functions for consistent navigation across the app
 */

/**
 * Handle navigation to internal routes using React Router
 * @param path - The route path to navigate to
 * @param navigate - React Router navigate function
 */
export const navigateToRoute = (path: string, navigate: (path: string) => void) => {
  navigate(path);
};

/**
 * Handle navigation to external URLs or special cases
 * @param url - The URL to navigate to
 */
export const navigateToExternal = (url: string) => {
  if (url.startsWith('tel:')) {
    // Handle phone calls
    window.open(url);
  } else if (url.startsWith('mailto:')) {
    // Handle emails
    window.open(url);
  } else if (url.startsWith('http://') || url.startsWith('https://')) {
    // Handle external URLs
    window.open(url, '_blank');
  } else {
    // Handle internal routes that can't use React Router
    window.location.href = url;
  }
};

/**
 * Common CTA actions with consistent behavior
 */
export const CTAActions = {
  // Authentication
  startFreeTrial: () => navigateToExternal('/auth'),
  signUp: () => navigateToExternal('/auth'),
  signIn: () => navigateToExternal('/auth'),
  
  // Contact & Sales
  contactSales: () => navigateToExternal('/contact'),
  scheduleDemo: () => navigateToExternal('/contact'),
  scheduleConsultation: () => navigateToExternal('/contact'),
  
  // Demos
  tryLiveDemo: () => navigateToExternal('/demos'),
  viewDemo: () => navigateToExternal('/demos'),
  
  // Products
  launchAIStudio: () => navigateToExternal('/ai-studio'),
  openGPTBuilder: () => navigateToExternal('/ai-studio/gpt-builder'),
  
  // Pricing
  viewPricing: () => navigateToExternal('/pricing'),
  viewMSPPricing: () => navigateToExternal('/msp-pricing'),
  
  // Email
  contactSupport: () => navigateToExternal('mailto:support@ultriumai.com'),
};

/**
 * Type for CTA button configurations
 */
export interface CTAButton {
  label: string;
  action: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'lg' | 'default';
  icon?: React.ComponentType<any>;
}

/**
 * Common CTA button configurations
 */
export const CommonCTAs: Record<string, CTAButton> = {
  startFreeTrial: {
    label: 'Start Free Trial',
    action: CTAActions.startFreeTrial,
    variant: 'default',
  },
  contactSales: {
    label: 'Contact Sales',
    action: CTAActions.contactSales,
    variant: 'outline',
  },
  scheduleDemo: {
    label: 'Schedule Demo',
    action: CTAActions.scheduleDemo,
    variant: 'outline',
  },
  tryLiveDemo: {
    label: 'Try Live Demo',
    action: CTAActions.tryLiveDemo,
    variant: 'default',
  },
  viewPricing: {
    label: 'View Pricing',
    action: CTAActions.viewPricing,
    variant: 'outline',
  },
};