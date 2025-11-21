import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../../Features/auth/authApi";
import { setCredentials } from "../../../Features/auth/authSlice";
import { useAppDispatch } from "../../hooks/hooks";
import type { LoginRequest } from "../../../Features/Types/types";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../../assets/Frame 8687 (1).png";
import { showApiError, type ApiError } from "../../../utils/errorHandler";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [seeConfirm, setSeeConfirm] = useState(false);
  const dispatch = useAppDispatch();
  const [loginUser, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({ mode: "onChange" });

  const onSubmit = async (data: LoginRequest) => {
    const loadingToast = toast.loading("Logging in...");
    try {
      const response = await loginUser(data).unwrap();
      localStorage.setItem("token", response.token);
      dispatch(setCredentials({ user: response.user, token: response.token }));
      toast.dismiss(loadingToast);
      toast.success("Login successful!");
      navigate("/dashboard");
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
          Log in to your account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm sm:text-base font-medium font-['Poppins'] text-[rgb(117,118,134)]">
              Email address
            </label>
            <input
              type="email"
              placeholder="Enter Email"
              {...register("email", { required: "Email is required" })}
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
            <div className="relative mt-2">
              <input
                type={seeConfirm ? "text" : "password"}
                placeholder="Enter Password"
                className="w-full px-3 py-2 border pr-10 border-gray-300 rounded-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400"
                {...register("password", { required: "Password is required" })}
              />
              <button
                type="button"
                onClick={() => setSeeConfirm(!seeConfirm)}
                className="absolute right-3 top-2.5 text-gray-600 cursor-pointer hover:text-gray-900"
              >
                {seeConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer bg-[rgb(13,145,101)] w-full py-2 text-white rounded-sm hover:bg-[rgb(23,184,131)] transition duration-200 disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="flex justify-between items-center mt-3">
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-[rgb(13,145,101)] hover:underline font-['Poppins'] text-sm sm:text-base cursor-pointer"
          >
            Forgot Password?
          </button>
          <p className="text-sm sm:text-base text-gray-500">
            Don’t have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-[rgb(13,145,101)] hover:underline font-['Poppins'] cursor-pointer"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
