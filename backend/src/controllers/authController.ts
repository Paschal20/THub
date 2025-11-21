// Import Express framework for building web applications and handling HTTP requests/responses
import express, { Response, Request } from "express";
import mongoose from "mongoose";
import { userModel, userSchema } from "../models/userModel";
import { School } from "../models/School";
import argon2 from "argon2";
import { generateToken } from "../utils/generate";
import axios from "axios";
import Joi from "joi"; // Import Joi

// Joi schema for user registration validation
const signUpSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Full name cannot be empty",
    "string.min": "Full name should have a minimum length of {#limit}",
    "string.max": "Full name should have a maximum length of {#limit}",
    "any.required": "Full name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email cannot be empty",
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
    .required()
    .messages({
      "string.empty": "Password cannot be empty",
      "string.min": "Password should have a minimum length of {#limit}",
      "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "any.required": "Password is required",
    }),
  schoolName: Joi.string().optional(), // Assuming schoolName is optional for signup
});

// Joi schema for user login validation
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email cannot be empty",
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password cannot be empty",
    "any.required": "Password is required",
  }),
});

export const signUp = async (req: Request, res: Response): Promise<void> => {
  // CORS headers are handled by middleware, but we can add specific ones if needed
  // The middleware already handles this based on CORS_ORIGIN environment variable

  try {
    console.log("Signup request:", req.body);

    // Validate request body against Joi schema
    const { error, value } = signUpSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details?.[0]?.message || "Validation error" });
      return;
    }

    const { fullName, email, password, schoolName } = value;

    const existingUser = await userModel.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await argon2.hash(password);

    const newUser = await userModel.create({
      fullName,
      email,
      password: hashedPassword,
      isEmailVerified: true,
    });

    console.log("User created:", newUser._id);
    
    const token = generateToken(String(newUser._id), newUser.role);
    
    const user = {
      id: String(newUser._id),
      fullName: newUser.fullName,
      email: newUser.email,
      username: newUser.email.split('@')[0],
      role: newUser.role,
    };
    
    res.status(201).json({ 
      message: "User created successfully",
      userId: String(newUser._id),
      token,
      user
    });
  } catch (err: any) {
    console.error("Signup error:", err.message || err);
    console.error("Full error details:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {

  try {
    console.log("Login attempt for:", req.body);

    // Validate request body against Joi schema
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details?.[0]?.message || "Validation error" });
      return;
    }

    const { email, password } = value;

    console.log("Finding user:", email);
    console.log("Mongoose connection state:", mongoose.connection.readyState);
    const findUser = await userModel.findOne({ email: email.toLowerCase() });
    if (!findUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let isPasswordValid = false;

    try {
      isPasswordValid = await argon2.verify(findUser.password, password);
    } catch (error) {
      if (findUser.password === password) {
        isPasswordValid = true;
        const hashedPassword = await argon2.hash(password);
        await userModel.findByIdAndUpdate(findUser._id, {
          password: hashedPassword,
        });
        console.log(`Password migrated to hash for user: ${findUser.email}`);
      }
    }

    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    if (!findUser.isEmailVerified) {
      res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
      return;
    }

    const token = generateToken(String(findUser._id), findUser.role);

    const user = {
      id: findUser._id,
      fullName: findUser.fullName,
      email: findUser.email,
      role: findUser.role,
    };

    res.status(200).json({
      message: "Login successful",
      user: user,
      token,
    });
  } catch (err: any) {
    console.error("Login error:", err.message || err);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

