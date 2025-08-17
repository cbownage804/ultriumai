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
 * Validates and sanitizes form input with enhanced security
 */
export const sanitizeInput = (input: string): string => {
  // First trim whitespace
  let sanitized = input.trim();
  
  // Remove dangerous script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/javascript:\s*/gi, '');
  sanitized = sanitized.replace(/data:\s*/gi, '');
  
  // Remove vbscript: protocol
  sanitized = sanitized.replace(/vbscript:\s*/gi, '');
  
  return sanitized;
};

/**
 * Enhanced HTML sanitization using DOMPurify for content that may contain HTML
 */
export const sanitizeHtmlContent = (html: string): string => {
  return sanitizeHtml(html);
};

/**
 * Validates URL protocols to prevent XSS
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};