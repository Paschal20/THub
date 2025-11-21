import React from "react";
import { useNavigate } from "react-router-dom";

const EmailVerificationSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md py-8 px-6 rounded-lg shadow-md text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verified!
          </h2>
          <p className="text-gray-600 mb-6">
            Your email has been successfully verified. You can now log in to your account.
          </p>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full bg-[rgb(13,145,101)] text-white py-2 px-4 rounded-sm hover:bg-[rgb(23,184,131)] transition duration-200"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationSuccess;
