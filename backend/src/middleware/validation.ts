/**
 * Request Validation Middleware
 *
 * This module provides validation middleware functions for API endpoints using Joi.
 * It validates incoming request data against predefined schemas and returns
 * appropriate error responses for invalid data.
 *
 * Key Features:
 * - Input validation for user registration, login, and profile updates
 * - Validation for reminder, quiz, chat, and file endpoints
 * - Type-safe validation with Joi schemas
 * - Consistent error handling and messaging
 * - Prevention of malformed data reaching controllers
 */

import { Request, Response, NextFunction } from "express";
import Joi from "joi";

/**
 * User Registration Validation Middleware
 *
 * Validates user registration data including full name, email, password, and confirmation.
 * Ensures data integrity before creating new user accounts.
 *
 * @param req - Express request object containing user registration data
 * @param res - Express response object
 * @param next - Express next function to continue to controller
 */
export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Define validation schema for user registration
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(50).required(), // Name between 2-50 characters
    email: Joi.string().email().required(), // Valid email format required
    password: Joi.string().min(6).max(12).required(), // Password 6-12 characters
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(), // Must match password
  });

  // Validate request body against schema
  const { error } = schema.validate(req.body);

  // If validation fails, return error response
  if (error) {
    res.status(400).json({
      message: error.details?.[0]?.message || "Validation error",
    });
    return;
  }

  // Validation passed, continue to controller
  next();
};

/**
 * User Login Validation Middleware
 *
 * Validates user login credentials (email and password).
 * Ensures proper format before authentication attempts.
 *
 * @param req - Express request object containing login credentials
 * @param res - Express response object
 * @param next - Express next function to continue to controller
 */
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Define validation schema for user login
  const schema = Joi.object({
    email: Joi.string().email().required(), // Valid email format required
    password: Joi.string().required(), // Password is required (no length restrictions for login)
  });

  // Validate request body against schema
  const { error } = schema.validate(req.body);

  // If validation fails, return error response
  if (error) {
    res.status(400).json({
      message: error.details?.[0]?.message || "Validation error",
    });
    return;
  }

  // Validation passed, continue to controller
  next();
};

/**
 * Profile Update Validation Middleware
 *
 * Validates user profile update data with conditional validation.
 * Allows partial updates while ensuring data integrity.
 *
 * @param req - Express request object containing profile update data
 * @param res - Express response object
 * @param next - Express next function to continue to controller
 */
export const validateUpdateProfile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Define validation schema for profile updates (all fields optional)
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(50), // Optional name update
    email: Joi.string().email(), // Optional email update
    password: Joi.string().min(6).max(12), // Optional password change
    currentPassword: Joi.string().when("password", {
      is: Joi.exist(), // When password is being changed
      then: Joi.required(), // Current password becomes required
      otherwise: Joi.optional(), // Otherwise it's optional
    }),
  });

  // Validate request body against schema
  const { error } = schema.validate(req.body);

  // If validation fails, return error response
  if (error) {
    res.status(400).json({
      message: error.details?.[0]?.message || "Validation error",
    });
    return;
  }

  // Validation passed, continue to controller
  next();
};

/**
 * Reminder Creation Validation Middleware
 *
 * Validates reminder creation data including title and datetime.
 * Ensures proper format for reminder scheduling.
 *
 * @param req - Express request object containing reminder data
 * @param res - Express response object
 * @param next - Express next function to continue to controller
 */
export const validateCreateReminder = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(200).required(), // Title required, reasonable length
    datetime: Joi.string().isoDate().required(), // ISO date string required
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({
      message: error.details?.[0]?.message || "Validation error",
    });
    return;
  }

  next();
};

/**
 * Reminder Update Validation Middleware
 *
 * Validates reminder update data with optional fields.
 * Allows partial updates to existing reminders.
 *
 * @param req - Express request object containing update data
 * @param res - Express response object
 * @param next - Express next function to continue to controller
 */
export const validateUpdateReminder = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(200), // Optional title update
    datetime: Joi.string().isoDate(), // Optional datetime update
  }).min(1); // At least one field must be provided

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({
      message: error.details?.[0]?.message || "Validation error",
    });
    return;
  }

  next();
};

/**
 * Quiz Creation Validation Middleware
 *
 * Validates quiz creation data including topic, difficulty, and number of questions.
 * Ensures proper constraints for quiz generation.
 *
 * @param req - Express request object containing quiz data
 * @param res - Express response object
 * @param next - Express next function to continue to controller
 */
export const validateCreateQuiz = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = Joi.object({
    topic: Joi.string().min(1).max(100).required(), // Topic required
    difficulty: Joi.string().valid("easy", "medium", "hard").required(), // Difficulty required
    numQuestions: Joi.number().integer().min(1).max(50).required(), // 1-50 questions
    questionType: Joi.string()
      .valid("multiple-choice", "true-false", "fill-in-the-blank")
      .optional(), // Optional question type
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({
      message: error.details?.[0]?.message || "Validation error",
    });
    return;
  }

  next();
};

/**
 * Chat Creation Validation Middleware
 *
 * Validates chat creation data with optional title.
 * Ensures proper format for new chat initialization.
 *
 * @param req - Express request object containing chat data
 * @param res - Express response object
 * @param next - Express next function to continue to controller
 */
export const validateCreateChat = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(100).optional(), // Optional title
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({
      message: error.details?.[0]?.message || "Validation error",
    });
    return;
  }

  next();
};

/**
 * Send Message Validation Middleware
 *
 * Validates message sending data including chat ID and message content.
 * Ensures message length and format constraints.
 *
 * @param req - Express request object containing message data
 * @param res - Express response object
 * @param next - Express next function to continue to controller
 */
export const validateSendMessage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = Joi.object({
    chatId: Joi.string().length(24).hex().required(), // MongoDB ObjectId format
    message: Joi.string().min(1).max(10000).required(), // Message content required
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({
      message: error.details?.[0]?.message || "Validation error",
    });
    return;
  }

  next();
};

/**
 * File Upload Validation Middleware
 *
 * Validates file upload constraints including file size and type.
 * Ensures uploaded files meet security and size requirements.
 *
 * @param req - Express request object containing file data
 * @param res - Express response object
 * @param next - Express next function to continue to controller
 */
export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    res.status(400).json({ message: "No files uploaded" });
    return;
  }

  const files = req.files as Express.Multer.File[];
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  for (const file of files) {
    if (file.size > maxFileSize) {
      res.status(400).json({
        message: `File ${file.originalname} exceeds maximum size of 10MB`,
      });
      return;
    }

    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        message: `File type ${file.mimetype} not allowed for ${file.originalname}`,
      });
      return;
    }
  }

  next();
};
