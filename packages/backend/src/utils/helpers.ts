/**
 * Helper utilities
 */

import { randomUUID, randomBytes } from 'crypto';

/**
 * Generate unique ID
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Generate a short, human-friendly invite code such as "OSU-4X7K".
 * Uses an unambiguous alphabet (no 0/O, 1/I) so it can be read out over the phone.
 */
export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(4);
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[bytes[i] % alphabet.length];
  }
  return `OSU-${suffix}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Parse date string to timestamp
 */
export function parseDate(dateString: string): number {
  return new Date(dateString).getTime();
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Get days remaining until date
 */
export function getDaysUntil(timestamp: number): number {
  const now = Date.now();
  const diff = timestamp - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Sleep/delay function
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry logic with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxAttempts - 1) {
        await delay(delayMs * Math.pow(2, i));
      }
    }
  }

  throw lastError;
}

/**
 * Validate contribution amount
 */
export function isValidAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= 999999999;
}

/**
 * Safe JSON stringify
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '[Circular Reference]';
  }
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Omit keys from object
 */
export function omit<T extends Record<string, any>>(
  obj: T,
  ...keys: string[]
): Partial<T> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Pick keys from object
 */
export function pick<T extends Record<string, any>>(
  obj: T,
  ...keys: string[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (key in obj) {
      result[key as keyof T] = obj[key];
    }
  }
  return result;
}
