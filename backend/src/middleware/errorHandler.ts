import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(error.errors).map((err: any) => err.message),
    });
    return;
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    res.status(409).json({
      message: 'Duplicate field value',
      field: Object.keys(error.keyValue)[0],
    });
    return;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({ message: 'Token expired' });
    return;
  }

  // Default error
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
