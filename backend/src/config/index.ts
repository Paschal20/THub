/**
 * Centralized Configuration Management
 *
 * This module provides a single source of truth for all application configuration.
 * It loads environment variables, validates them, and provides type-safe access
 * to configuration values throughout the application.
 *
 * Key Features:
 * - Environment variable loading and validation
 * - Type-safe configuration interface
 * - Default values for development
 * - Warning system for missing required variables
 * - Centralized configuration for easy maintenance
 */

import dotenv from "dotenv";

// Load environment variables from .env file
// This must be called before accessing process.env
dotenv.config();

/**
 * Configuration Interface
 *
 * Defines the structure and types for all application configuration values.
 * Each property corresponds to an environment variable with sensible defaults.
 */
interface Config {
  /** Server port number */
  port: number;
  /** Node.js environment (development, production, test) */
  nodeEnv: string;
  /** JWT secret key for token signing */
  jwtSecret: string;
  /** JWT token expiration time */
  jwtExpiresIn: string;
  /** MongoDB connection URI */
  mongoUri: string;
  /** CORS allowed origin for frontend requests */
  corsOrigin: string;
  /** Email service username */
  emailUser: string;
  /** Email service password */
  emailPass: string;
  /** Frontend application URL */
  frontendUrl: string;
  /** Cloudinary cloud name for file storage */
  cloudinaryCloudName: string;
  /** Cloudinary API key */
  cloudinaryApiKey: string;
  /** Cloudinary API secret */
  cloudinaryApiSecret: string;
  /** Cloudinary folder for organizing uploads */
  cloudinaryFolder: string;
  /** OpenAI API key for AI services */
  openaiApiKey: string;
}

/**
 * Application Configuration Object
 *
 * Contains all configuration values with environment variable overrides and defaults.
 * Values are parsed and validated at startup time.
 */
const config: Config = {
  // Server configuration
  port: parseInt(process.env.PORT || "5040", 10), // Default port for development
  nodeEnv: process.env.NODE_ENV || "development", // Environment mode

  // Authentication configuration
  jwtSecret: process.env.JWT_SECRET || "your-secret-key", // JWT signing secret
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d", // Token validity period

  // Database configuration
  mongoUri:
    process.env.MONGODB_URL ||
    (() => {
      throw new Error(
        "MONGODB_URL environment variable is required but not set"
      );
    })(), // MongoDB connection string - must be set in environment

  // CORS configuration
  corsOrigin:
    process.env.CORS_ORIGIN ||
    "https://timely-hub-frontend-paschal-vercel-pink.vercel.app", // Frontend origin for CORS

  // Email service configuration
  emailUser: process.env.EMAIL_USER || "", // SMTP username
  emailPass: process.env.EMAIL_PASS || "", // SMTP password

  // Frontend configuration
  frontendUrl:
    process.env.FRONTEND_URL ||
    "https://timely-hub-frontend-paschal-vercel-pink.vercel.app", // Frontend application URL

  // Cloudinary configuration for file uploads
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "", // Cloudinary cloud identifier
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "", // Cloudinary API key
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "", // Cloudinary API secret
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "timelyhub", // Upload folder organization

  // AI service configuration
  openaiApiKey: process.env.OPENAI_API_KEY || "", // OpenAI API key for AI features
};

/**
 * Required Environment Variables Validation
 *
 * List of environment variables that are critical for application functionality.
 * The application will warn if these are missing but won't crash, allowing for
 * graceful degradation in development environments.
 */
const requiredEnvVars = [
  "JWT_SECRET", // Required for authentication
  "MONGODB_URL", // Required for database connectivity
  "EMAIL_USER", // Required for email notifications
  "EMAIL_PASS", // Required for email notifications
  "CLOUDINARY_CLOUD_NAME", // Required for file uploads
  "CLOUDINARY_API_KEY", // Required for file uploads
  "CLOUDINARY_API_SECRET", // Required for file uploads
  "OPENAI_API_KEY", // Required for AI features
];

/**
 * Environment Variable Validation
 *
 * Checks for missing required environment variables and logs warnings.
 * This helps developers identify configuration issues early.
 */
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    "⚠️  Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  console.warn(
    "   Some features may not work correctly. Please check your .env file."
  );
  console.warn(
    "   Refer to env.example for the complete list of required variables."
  );
}

// Export the configuration object as the default export
export default config;
