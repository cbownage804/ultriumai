import { z } from 'zod';
import { sanitizeInput } from './security';

// Security Settings validation schema
export const securitySettingsSchema = z.object({
  two_factor_enabled: z.boolean(),
  session_timeout_minutes: z.number().min(5).max(1440), // 5 minutes to 24 hours
  login_notifications: z.boolean(),
  ip_whitelist: z.array(z.string().ip()).optional(),
});

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeInput),
  email: z.string().email().max(255).transform(sanitizeInput),
  subject: z.string().min(1).max(200).transform(sanitizeInput),
  message: z.string().min(10).max(2000).transform(sanitizeInput),
});

// User registration validation schema
export const userRegistrationSchema = z.object({
  email: z.string().email().max(255).transform(sanitizeInput),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(100).transform(sanitizeInput).optional(),
  company_name: z.string().min(1).max(100).transform(sanitizeInput).optional(),
});

// API key validation schema
export const apiKeySchema = z.object({
  key_name: z.string().min(1).max(100).transform(sanitizeInput),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    admin: z.boolean(),
  }),
  rate_limit_per_hour: z.number().min(1).max(10000),
  expires_at: z.date().optional(),
  allowed_ips: z.array(z.string().ip()).optional(),
  scopes: z.array(z.string()).optional(),
});

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