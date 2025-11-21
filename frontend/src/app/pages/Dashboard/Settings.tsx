// Setting.tsx
import { Eye, EyeOff } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { useUpdateUserProfileMutation } from "../../../Features/auth/authApi";
import { updateUser } from "../../../Features/auth/authSlice";
import toast from "react-hot-toast";
import Button from "../../../Components/Button";
import type { ErrorResponse, User } from "../../../Features/Types/types";

const Setting: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [updateUserProfile, { isLoading }] = useUpdateUserProfileMutation();

  // Local state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [seeCurrent, setSeeCurrent] = useState(false);
  const [seeNew, setSeeNew] = useState(false);
  const [seeConfirm, setSeeConfirm] = useState(false);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Please login to update profile");
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      toast.error("Full name and email are required");
      return;
    }

    const isChangingPassword = newPassword || currentPassword;

    if (isChangingPassword) {
      if (!currentPassword) {
        toast.error("Please enter your current password");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("New password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
    }

    try {
      const updateData: User = {
        id: user.id,
        fullName,
        email,
      };

      if (isChangingPassword) {
        updateData.password = newPassword;
        updateData.currentPassword = currentPassword;
      }

      const response = await updateUserProfile(updateData).unwrap();

      dispatch(
        updateUser({
          fullName: response.data.fullName,
          email: response.data.email,
        })
      );

      toast.success("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const typedErr = err as { err: ErrorResponse };
      if (typedErr.err?.status === 500) {
        toast.error("Server unavailable. Try again later.");
      } else if (typedErr.err?.data?.message) {
        toast.error(typedErr.err?.data.message);
      } else {
        toast.error("Update failed.");
      }
    }
  };

 

  // Check if there are any changes
  const hasChanges =
    fullName !== user?.fullName ||
    email !== user?.email ||
    newPassword ||
    currentPassword;

  return (
    <div className="h-full overflow-y-auto sm:overflow-hidden p-2 sm:p-6">
      <div className="bg-white rounded-2xl shadow-md p-2 sm:p-8 w-full max-w-3xl mx-auto">
        {/* Profile Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 sm:w-11 sm:h-11 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-700 font-semibold text-lg">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-semibold">
                {user?.fullName || "User"}
              </h2>
              <p className="text-gray-500 text-sm">
                {user?.email || "email@example.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded text-gray-500 h-10 bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed focus:outline-none focus:border-2 focus:border-green-500 p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded h-10  text-gray-500 bg-gray-100 cursor-not-allowed focus:outline-none focus:border-2 focus:border-green-500 p-2"
            />
          </div>
        </div>

        {/* Change Password Section */}
        <h3 className="text-md font-semibold mb-4">
          Change Password (Optional)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Current Password - Note: Your backend doesn't verify this */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <div className="relative mt-2">
              <input
                type={seeCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full p-2 pr-10 text-gray-500 bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setSeeCurrent(!seeCurrent)}
                className="absolute right-3 top-2.5 text-gray-600 cursor-pointer hover:text-gray-900"
              >
                {seeCurrent ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative mt-2">
              <input
                type={seeNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full p-2 pr-10 text-gray-500 bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setSeeNew(!seeNew)}
                className="absolute right-3 top-2.5 text-gray-600 cursor-pointer hover:text-gray-900"
              >
                {seeNew ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="relative mt-2">
              <input
                type={seeConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
               className="w-full p-2 pr-10 text-gray-500 bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setSeeConfirm(!seeConfirm)}
                className="absolute right-3 top-2.5 text-gray-600 cursor-pointer hover:text-gray-900"
              >
                {seeConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-5">
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            text={`${isLoading ? "Saving..." : "Save changes"}`}
            className={`px-6 py-2 rounded-lg text-white ${
              !isLoading && hasChanges
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default Setting;
