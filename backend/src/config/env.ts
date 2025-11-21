import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local file (only for local development)
// Vercel injects environment variables directly, so this is skipped in production
if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
}

// Define the configuration interface
interface Config {
  // Server Configuration
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  // Database
  mongodbUrl: string;
  
  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // CORS
  corsOrigins: string[];
  
  // Uploads
  uploadDir: string;
  maxAttachmentSizeBytes: number;
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMax: number;
  
  // Cloudinary
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder: string;
  };
  
  // Email
  emailUser?: string;
  emailPass?: string;
  
  // AI Services
  openaiApiKey?: string;
  geminiApiKey?: string;
  
  // Frontend
  frontendUrl: string;
  
  // Feature Flags
  mockAi: boolean;
  
  // Vercel
  vercel?: string;
}

// Helper function to get required environment variable
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Helper function to parse boolean environment variables
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Parse and validate configuration
const config: Config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '5040', 10),
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  
  // Database
  mongodbUrl: getRequiredEnvVar('MONGODB_URL'),
  
  // JWT
  jwtSecret: getRequiredEnvVar('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim()),
  
  // Uploads
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxAttachmentSizeBytes: parseInt(process.env.MAX_ATTACHMENT_SIZE_BYTES || '52428800', 10),
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
  
  // Cloudinary (optional)
  ...(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      folder: process.env.CLOUDINARY_FOLDER || 'timely-hub'
    }
  }),
  
  // Email (optional)
  ...(process.env.EMAIL_USER && { emailUser: process.env.EMAIL_USER }),
  ...(process.env.EMAIL_PASS && { emailPass: process.env.EMAIL_PASS }),
  
  // AI Services (optional)
  ...(process.env.OPENAI_API_KEY && { openaiApiKey: process.env.OPENAI_API_KEY }),
  ...(process.env.GEMINI_API_KEY && { geminiApiKey: process.env.GEMINI_API_KEY }),
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Feature Flags
  mockAi: parseBoolean(process.env.MOCK_AI, false),
  
  // Vercel
  ...(process.env.VERCEL && { vercel: process.env.VERCEL })
};

export default config;
