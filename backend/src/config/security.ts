/**
 * Security Configuration Module
 *
 * This module configures various security headers and policies for the Express application
 * using Helmet.js and custom security middleware. It implements multiple layers of security
 * to protect against common web vulnerabilities.
 *
 * Key Security Features:
 * - Content Security Policy (CSP) to prevent XSS attacks
 * - HTTP Strict Transport Security (HSTS) for HTTPS enforcement
 * - Security headers to prevent clickjacking, MIME sniffing, and other attacks
 * - XSS protection and referrer policy controls
 */

import helmet from 'helmet';

/**
 * Helmet Configuration
 *
 * Helmet.js provides security headers to protect against common web vulnerabilities.
 * This configuration is tailored for a full-stack application with external API integrations.
 */
export const helmetConfig = helmet({
  /**
   * Content Security Policy (CSP)
   *
   * Defines allowed sources for different types of content to prevent XSS attacks.
   * Configured to allow necessary external resources while maintaining security.
   */
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Only allow content from the same origin by default
      styleSrc: [
        "'self'", // Allow styles from same origin
        "'unsafe-inline'", // Allow inline styles (required for some UI libraries)
        "https://fonts.googleapis.com" // Allow Google Fonts
      ],
      fontSrc: [
        "'self'", // Allow fonts from same origin
        "https://fonts.gstatic.com" // Allow Google Fonts CDN
      ],
      scriptSrc: ["'self'"], // Only allow scripts from same origin
      imgSrc: [
        "'self'", // Allow images from same origin
        "data:", // Allow data URIs (for small images/icons)
        "https:", // Allow HTTPS images (Cloudinary, etc.)
        "http:" // Allow HTTP images (legacy support)
      ],
      connectSrc: [
        "'self'", // Allow connections to same origin
        "https://api.openai.com", // Allow OpenAI API calls
        "https://api.cloudinary.com" // Allow Cloudinary API calls
      ],
    },
  },

  /**
   * Cross-Origin Embedder Policy
   *
   * Disabled to allow cross-origin resources (fonts, external APIs).
   * May be re-enabled in production with proper CORS configuration.
   */
  crossOriginEmbedderPolicy: false,

  /**
   * Cross-Origin Resource Policy
   *
   * Disabled to allow cross-origin requests from the frontend.
   * Prevents blocking of legitimate cross-origin API calls.
   */
  crossOriginResourcePolicy: false,

  /**
   * HTTP Strict Transport Security (HSTS)
   *
   * Forces HTTPS connections for one year, including subdomains.
   * Helps prevent man-in-the-middle attacks and protocol downgrade attacks.
   */
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true, // Apply to all subdomains
    preload: true // Allow preloading in browser HSTS lists
  }
});

/**
 * Custom Security Headers Middleware
 *
 * Adds additional security headers not covered by Helmet.js.
 * These headers provide extra protection against various attack vectors.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const securityHeaders = (req: any, res: any, next: any) => {
  // Prevent clickjacking attacks by denying iframe embedding
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filtering in legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information sent with requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Continue to next middleware
  next();
};
