import crypto from 'crypto';
import { userModel } from '../models/userModel';
import { notificationService } from '../services/notificationService';

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendPasswordResetEmail = async (userId: string): Promise<void> => {
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = generatePasswordResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with password reset token
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send password reset email
    await notificationService.sendPasswordResetEmail(user.email, resetToken);

  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const user = await userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return { success: false, message: 'Invalid or expired reset token' };
    }

    // Hash the new password using argon2
    const argon2 = await import('argon2');
    const hashedPassword = await argon2.hash(newPassword);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = null as any;
    user.passwordResetExpires = null as any;
    await user.save();

    return { success: true, message: 'Password reset successfully' };

  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, message: 'An error occurred during password reset' };
  }
};
