/**
 * Rate Limiting Middleware Configuration
 *
 * This module provides different rate limiters for various API endpoints to prevent abuse
 * and ensure fair usage across the application. Each limiter is configured with specific
 * thresholds based on the sensitivity and resource intensity of the operations.
 */

import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 *
 * Applied to most API endpoints to prevent general abuse.
 * Allows 100 requests per 15-minute window per IP address.
 * This is a reasonable limit for general API usage without being too restrictive.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes - standard window for rate limiting
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers (RFC 6585)
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers (deprecated)
});

/**
 * Authentication Rate Limiter
 *
 * Stricter limits for authentication endpoints (login/signup) to prevent brute force attacks.
 * Only allows 5 attempts per 3-minute window per IP address.
 * This is intentionally restrictive to protect against credential stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes - reduced cooldown for better user experience
  max: 5, // limit each IP to 5 authentication attempts per windowMs
  message: {
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '3 minutes'
  },
  standardHeaders: true, // Enable standard rate limit headers
  legacyHeaders: false, // Disable legacy headers
});

/**
 * File Upload Rate Limiter
 *
 * Limits file upload operations which are resource-intensive.
 * Allows 10 uploads per hour per IP address to prevent storage abuse.
 * Longer window (1 hour) reflects the higher cost of file operations.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour - longer window for resource-intensive operations
  max: 10, // limit each IP to 10 file uploads per hour
  message: {
    message: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true, // Enable standard rate limit headers
  legacyHeaders: false, // Disable legacy headers
});

/**
 * AI/Chat Rate Limiter
 *
 * Limits AI-powered operations (chat messages, quiz generation) which consume external API resources.
 * Allows 50 requests per hour per IP address.
 * Balances user needs with API cost management and fair usage.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour - matches upload limiter for consistency
  max: 50, // limit each IP to 50 AI requests per hour
  message: {
    message: 'Too many AI requests, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true, // Enable standard rate limit headers
  legacyHeaders: false, // Disable legacy headers
});
