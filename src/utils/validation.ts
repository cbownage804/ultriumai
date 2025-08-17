import { z } from 'zod';
import { sanitizeInput, sanitizeHtmlContent, isValidUrl } from './security';

// Enhanced sanitization transformers
const sanitizeText = (val: string) => sanitizeInput(val);
const sanitizeHtml = (val: string) => sanitizeHtmlContent(val);

// Security Settings validation schema
export const securitySettingsSchema = z.object({
  two_factor_enabled: z.boolean(),
  session_timeout_minutes: z.number().min(5).max(1440), // 5 minutes to 24 hours
  login_notifications: z.boolean(),
  ip_whitelist: z.array(z.string().ip()).optional(),
});

// Contact form validation schema with enhanced security
export const contactFormSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeText),
  email: z.string().email().max(255).transform(sanitizeText),
  subject: z.string().min(1).max(200).transform(sanitizeText),
  message: z.string().min(10).max(2000).transform(sanitizeText),
});

// User registration validation schema
export const userRegistrationSchema = z.object({
  email: z.string().email().max(255).transform(sanitizeText),
  password: z.string().min(12).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
  ),
  full_name: z.string().min(1).max(100).transform(sanitizeText).optional(),
  company_name: z.string().min(1).max(100).transform(sanitizeText).optional(),
});

// API key validation schema with enhanced security
export const apiKeySchema = z.object({
  key_name: z.string().min(1).max(100).transform(sanitizeText),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    admin: z.boolean(),
  }),
  rate_limit_per_hour: z.number().min(1).max(10000),
  expires_at: z.date().optional(),
  allowed_ips: z.array(z.string().ip()).optional(),
  scopes: z.array(z.string().max(50).transform(sanitizeText)).optional(),
});

// URL validation schema
export const urlSchema = z.string().refine(isValidUrl, {
  message: 'Invalid or unsafe URL protocol',
});

// HTML content validation schema
export const htmlContentSchema = z.string().transform(sanitizeHtml);

// Generic form validation helper
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};