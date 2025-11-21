import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../../../Features/auth/authApi";
import type { RegisterRequest } from "../../../Features/Types/types";
import logo from "../../../assets/Frame 8687 (1).png";
import toast from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { showApiError } from "../../../utils/errorHandler";
import type { ApiError } from "../../../utils/errorHandler";

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },

  
  } = useForm<RegisterRequest>({ mode: "onChange" });

  const [registerUser, { isLoading }] = useRegisterMutation();
  const password = watch("password");

  const onError = () =>
    toast.error("Please fill in all fields correctly");

  const onSubmit = async (data: RegisterRequest) => {
    const loadingToast = toast.loading("Creating your account...");
    try {
      await registerUser(data).unwrap();
      toast.dismiss(loadingToast);
      toast.success("Account created successfully! You can now log in.");
      navigate("/login");
    } catch (err) {
      toast.dismiss(loadingToast);
      showApiError(err as ApiError);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 px-4 overflow-hidden">
      <div className="bg-white w-full max-w-md sm:max-w-sm md:max-w-md py-4 px-6 sm:p-8 rounded-lg shadow-md flex flex-col">
        <div className="flex items-center justify-center mb-2">
          <img
            src={logo}
            alt="company logo"
            className="w-[110px] sm:w-[130px] md:w-[160px] h-auto"
          />
        </div>

        <h2
          className="text-center mb-3 font-bold text-lg sm:text-xl font-['Poppins']"
          style={{ color: "rgb(48,52,71)" }}
        >
          Sign up to your account
        </h2>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-1">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm sm:text-base font-medium font-['Poppins'] text-[rgb(117,118,134)]">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Full Name"
              {...register("fullName", {
                required: "Full name is required",
                minLength: {
                  value: 2,
                  message: "Full name must be at least 2 characters",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <div className="h-4 mt-0.5">
              {errors.fullName && (
                <p className="text-red-500 text-xs sm:text-sm">
                  {errors.fullName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm sm:text-base font-medium font-['Poppins'] text-[rgb(117,118,134)]">
              Email
            </label>
            <input
              type="email"
              placeholder="Email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <div className="h-4 mt-0.5">
              {errors.email && (
                <p className="text-red-500 text-xs sm:text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm sm:text-base font-medium font-['Poppins'] text-[rgb(117,118,134)]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <AiOutlineEye size={20} />
                ) : (
                  <AiOutlineEyeInvisible size={20} />
                )}
              </button>
            </div>
            <div className="h-4 mt-0.5">
              {errors.password && (
                <p className="text-red-500 text-xs sm:text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-sm sm:text-base font-medium font-['Poppins'] text-[rgb(117,118,134)]">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                {...register("confirmPassword", {
                  required: "Please confirm password",
                  validate: (val) =>
                    val === password || "Passwords do not match",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? (
                  <AiOutlineEye size={20} />
                ) : (
                  <AiOutlineEyeInvisible size={20} />
                )}
              </button>
            </div>
            <div className="h-4 mt-0.5">
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs sm:text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer bg-[rgb(13,145,101)] w-full py-2 text-white rounded-sm hover:bg-[rgb(23,184,131)] transition duration-200 disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm sm:text-base text-gray-500 mt-3">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[rgb(13,145,101)] hover:underline font-['Poppins'] cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
