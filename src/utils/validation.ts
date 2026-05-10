import { z } from 'zod';

// GPS coordinates validation schema
export const gpsCoordinatesSchema = z.object({
  latitude: z.number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z.number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

// Session name validation schema
export const sessionNameSchema = z.string()
  .trim()
  .min(1, "Session name is required")
  .max(100, "Session name must be less than 100 characters")
  .regex(/^[a-zA-Z0-9\s\u0600-\u06FF\-_]+$/, "Session name contains invalid characters");

// Course name validation schema
export const courseNameSchema = z.string()
  .trim()
  .min(1, "Course name is required")
  .max(100, "Course name must be less than 100 characters")
  .regex(/^[a-zA-Z0-9\s\u0600-\u06FF\-_]+$/, "Course name contains invalid characters");

// Professor code validation
export const professorCodeSchema = z.string()
  .trim()
  .min(4, "Professor code must be at least 4 characters")
  .max(20, "Professor code must be less than 20 characters")
  .regex(/^[A-Z0-9]+$/, "Professor code must be uppercase letters and numbers only");

// Validate GPS coordinates
export function validateGPSCoordinates(latitude: number, longitude: number): { valid: boolean; error?: string } {
  const result = gpsCoordinatesSchema.safeParse({ latitude, longitude });
  if (!result.success) {
    return { valid: false, error: result.error.errors[0]?.message };
  }
  return { valid: true };
}

// Validate session name
export function validateSessionName(name: string): { valid: boolean; error?: string } {
  const result = sessionNameSchema.safeParse(name);
  if (!result.success) {
    return { valid: false, error: result.error.errors[0]?.message };
  }
  return { valid: true };
}

// Validate course name
export function validateCourseName(name: string): { valid: boolean; error?: string } {
  const result = courseNameSchema.safeParse(name);
  if (!result.success) {
    return { valid: false, error: result.error.errors[0]?.message };
  }
  return { valid: true };
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string, 
  maxAttempts: number = 3, 
  windowMs: number = 60000
): { allowed: boolean; remainingAttempts: number; resetInSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
  }
  
  if (record.count >= maxAttempts) {
    const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remainingAttempts: 0, resetInSeconds };
  }
  
  record.count++;
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - record.count, 
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000) 
  };
}

// Clear rate limit for a key
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
