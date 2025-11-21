import { Request, Response, NextFunction } from 'express';
import config from '../config/env';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get allowed origins from config (supports multiple origins)
  const allowedOrigins = config.corsOrigins;

  // Check if the request origin is allowed
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};