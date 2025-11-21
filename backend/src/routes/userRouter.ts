import express, { Router } from "express";
import {
  getAll,
  clearAllUsers,
  getOne,
  update,
  deleteOne,
  logout,
  forgotPassword,
  resetPasswordController,
  deleteAccount,
} from "../controllers/userController";
import { signUp, loginUser } from "../controllers/authController";
import { getActivities } from "../controllers/activityController";
import { protect } from "../middleware/authMiddleware";

import { authLimiter } from "../middleware/rateLimiter";

// Create and export a new Express router instance for defining user-related routes
export const userRouter: Router = express.Router();

userRouter.get("/getAll", getAll);
userRouter.delete("/clearAll", clearAllUsers);
userRouter.get("/getOne/:id", getOne);
userRouter.post("/signup", signUp);
userRouter.get("/signup", (req, res) => {
  res.status(405).json({ message: "Method not allowed. Use POST for signup." });
});
userRouter.post("/loginUser", loginUser);
userRouter.post("/logout", logout);
userRouter.patch("/update/:id", update);
userRouter.delete("/deleteOne/:id", deleteOne);
userRouter.get("/activities", protect, getActivities);
userRouter.get("/verify-email", async (req, res) => {
  // Email verification is disabled - all accounts are automatically verified
  res.status(200).json({
    success: true,
    message: "Email verification is not required. All accounts are automatically verified."
  });
});

// Define a POST route for "/forgot-password" to initiate password reset
userRouter.post("/forgot-password", forgotPassword);
// Define a POST route for "/reset-password" to reset password using token
userRouter.post("/reset-password", resetPasswordController);
// Define a DELETE route for "/delete-account" to delete the authenticated user's account
userRouter.delete("/delete-account", protect, deleteAccount);


