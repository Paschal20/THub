import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import logo from "../../../assets/Frame 8687 (1).png";

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ mode: "onChange" });

  const onSubmit = async () => {
    const loadingToast = toast.loading("Processing...");
    try {
      // Simulate API call or implement actual forgot password logic
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Placeholder delay

      toast.dismiss(loadingToast);
      toast.success("If this email exists, a reset link has been sent!");
      navigate("/login"); // redirect back to login
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Something went wrong. Try again.");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 px-4 overflow-hidden">
      <div className="bg-white w-full max-w-md sm:max-w-sm md:max-w-md px-6 py-4 sm:p-8 rounded-lg shadow-md flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center mb-2">
          <img
            src={logo}
            alt="company logo"
            className="w-[110px] sm:w-[130px] md:w-[160px] h-auto"
          />
        </div>

        <h2
          className="text-center mb-4 font-bold text-lg sm:text-xl font-['Poppins']"
          style={{ color: "rgb(48,52,71)" }}
        >
          Forgot Password
        </h2>

        <p className="text-center text-sm sm:text-base text-gray-500 mb-4">
          Enter your email and we’ll send you a password reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <div className="flex flex-col gap-1">
            <label className="text-sm sm:text-base font-medium font-['Poppins'] text-[rgb(117,118,134)]">
              Email address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
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

          <button
            type="submit"
            // disabled={isLoading}
            className="cursor-pointer bg-[rgb(13,145,101)] w-full py-2 text-white rounded-sm hover:bg-[rgb(23,184,131)] transition duration-200 disabled:opacity-50"
          >
            Send Reset Link
          </button>
        </form>

        <p className="text-center text-sm sm:text-base text-gray-500 mt-3">
          Remember your password?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[rgb(13,145,101)] hover:underline font-['Poppins']"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
