import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import axios from "axios";
import { useAppSelector } from "../../../../app/hooks/hooks";
import toast from "react-hot-toast";

export default function CBTUserVerification({ onUserVerified }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Since this component is only rendered when user is authenticated (protected route),
    // automatically proceed with verification
    handleVerification();
  }, [handleVerification]);

  const handleVerification = useCallback(async () => {
    setIsVerifying(true);
    try {
      // Sign up with external CBT API
      const userName = auth.user?.fullName || auth.user?.name || "User";
      const userEmail = auth.user?.email || "";
      const signUpResponse = await axios.post(
        "https://kode10x-quiz-app-backend.onrender.com/api/user/signUp",
        {
          fullName: userName,
          email: userEmail,
          password: "timelyhub123", // Dummy password for CBT integration
        }
      );
      console.log("External sign up response:", signUpResponse.data);

      // Assume signup returns token (check console)
      const token = signUpResponse.data.token || signUpResponse.data.authToken;
      if (!token) {
        throw new Error("No token received from CBT signup");
      }

      // Store external auth data
      localStorage.setItem("cbt_authToken", token);
      localStorage.setItem("cbt_verifiedUser", JSON.stringify(signUpResponse.data.user));

      const userData = {
        name: auth.user?.fullName || auth.user?.name || "User",
        email: auth.user?.email || "",
        data: auth.user
      };
      onUserVerified(userData);
      toast.success("Verification successful!");
    } catch (error) {
      console.error("Verification error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      toast.error(`Verification failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsVerifying(false);
    }
  }, [auth.user, onUserVerified]);

  return (
    <div className="space-y-8 py-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">CBT Verification</h1>
        <p className="text-gray-600">Verifying your access to CBT</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md mx-auto border border-gray-100">
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Welcome, {auth.user?.fullName || auth.user?.name}!</h2>
            <p className="text-gray-600 mt-2">You are authenticated and ready to take the CBT quiz.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Name:</span>
              <span className="text-sm font-medium">{auth.user?.fullName || auth.user?.name}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm font-medium">{auth.user?.email}</span>
            </div>
          </div>

          <button
            onClick={handleVerification}
            disabled={isVerifying}
            className="w-full bg-emerald-600 flex items-center justify-center hover:bg-emerald-700 text-white font-semibold rounded-md py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Verifying...
              </div>
            ) : (
              'Start CBT Quiz'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}