import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  });
};

/**
 * Safely opens a new window with security parameters
 */
export const safeWindowOpen = (url: string, target?: string, features?: string): Window | null => {
  const secureFeatures = features ? `${features},noopener,noreferrer` : 'noopener,noreferrer';
  return window.open(url, target, secureFeatures);
};

/**
 * Validates and sanitizes form input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};