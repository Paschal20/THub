import crypto from "crypto";
import { userModel } from "../models/userModel";
import { notificationService } from "../services/notificationService";

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const sendVerificationEmail = async (userId: string): Promise<void> => {
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update user with verification token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email (skip in serverless if email not configured)
    try {
      await notificationService.sendEmailVerification(
        user.email,
        verificationToken
      );
    } catch (err: unknown) {
      // Explicitly type the error
      const emailError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        "Email service not available, skipping verification email:",
        emailError.message
      );
    }
  } catch (err: unknown) {
    // Explicitly type the error
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Error sending verification email:", error.message);
    throw error;
  }
};

export const verifyEmail = async (
  token: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Verifying token:", token);
    console.log("Token length:", token.length);
    const now = new Date();
    console.log("Current time:", now);
    const query = {
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: now },
    };
    console.log("Query:", query);
    const user = await userModel.findOne(query);
    console.log(
      "User found:",
      user
        ? {
            email: user.email,
            token: user.emailVerificationToken,
            expires: user.emailVerificationExpires,
          }
        : "No user found"
    );
    console.log("Token match:", user?.emailVerificationToken === token);
    console.log(
      "Expires check:",
      user?.emailVerificationExpires && user.emailVerificationExpires > now
    );

    if (!user) {
      return {
        success: false,
        message: "Invalid or expired verification token",
      };
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null as any;
    user.emailVerificationExpires = null as any;
    await user.save();

    return { success: true, message: "Email verified successfully" };
  } catch (error) {
    console.error("Error verifying email:", error);
    return {
      success: false,
      message: "An error occurred during email verification",
    };
  }
};
