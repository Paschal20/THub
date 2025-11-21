import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import toast from "react-hot-toast";
import logo from "../../../assets/Frame 8687 (1).png";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
// import { useResetPasswordMutation } from "../../../Features/auth/authApi"; // new endpoint

// interface ResetPasswordForm {
//   password: string;
//   confirmPassword: string;
// }

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const token = searchParams.get("token");
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     watch,
//     formState: { errors },
//   } = useForm<ResetPasswordForm>({
//     mode: "onChange",
//   });

//   const [resetPassword, { isLoading }] = useResetPasswordMutation();

//   const onSubmit = async (data: ResetPasswordForm) => {
//     if (!token) {
//       toast.error("Invalid or expired token.");
//       return;
//     }

//     const loadingToast = toast.loading("Resetting password...");
//     try {
//       await resetPassword({
//         token,
//         password: data.password,
//         confirmPassword: data.confirmPassword,
//       }).unwrap();

//       toast.dismiss(loadingToast);
//       toast.success("Password reset successfully!");
//       navigate("/login");
//     } catch (err: any) {
//       toast.dismiss(loadingToast);
//       toast.error(err?.data?.message || "Failed to reset password.");
//     }
//   };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 px-4 overflow-hidden">
      <div className="bg-white w-full max-w-md sm:max-w-sm md:max-w-md px-6 py-4 sm:p-8 rounded-lg shadow-md flex flex-col">
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
          Reset Password
        </h2>

        <form className="space-y-1">
          {/* Password */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-sm sm:text-base font-medium font-['Poppins'] text-[rgb(117,118,134)]">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                // {...register("password", {
                //   required: "Password is required",
                //   minLength: { value: 6, message: "Minimum 6 characters" },
                // })}
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
            {/* <div className="h-4 mt-0.5">
              {errors.password && (
                <p className="text-red-500 text-xs sm:text-sm">
                  {errors.password.message}
                </p>
              )}
            </div> */}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-sm sm:text-base font-medium font-['Poppins'] text-[rgb(117,118,134)]">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                // {...register("confirmPassword", {
                //   required: "Confirm password is required",
                //   validate: (val) =>
                //     val === watch("password") || "Passwords do not match",
                // })}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                 {showConfirmPassword ? (
                                  <AiOutlineEye size={20} />
                                ) : (
                                  <AiOutlineEyeInvisible size={20} />
                                )}
              </button>
            </div>
            {/* <div className="h-4 mt-0.5">
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs sm:text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div> */}
          </div>

          <button
            type="submit"
            // disabled={isLoading}
            className="cursor-pointer bg-[rgb(13,145,101)] w-full py-2 text-white rounded-sm hover:bg-[rgb(23,184,131)] transition duration-200 disabled:opacity-50"
          >
          Reset Password
          </button>
        </form>

        <p className="text-center text-sm sm:text-base text-gray-500 mt-3">
          Remembered your password?{" "}
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

export default ResetPassword;
