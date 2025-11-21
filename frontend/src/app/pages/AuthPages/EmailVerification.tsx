import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setVerificationStatus('error');
        toast.error('Verification token is missing');
        return;
      }

      try {
        const response = await fetch(`/api/verify-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setVerificationStatus('success');
          toast.success('Email verified successfully! You can now log in.');
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setVerificationStatus('error');
          toast.error(data.message || 'Email verification failed');
        }
      } catch (error) {
        setVerificationStatus('error');
        toast.error('An error occurred during verification');
        console.error('Verification error:', error);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md py-8 px-6 rounded-lg shadow-md text-center">
        {verificationStatus === 'loading' && (
          <>
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Email...
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address.
              </p>
            </div>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
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
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">
                The verification link is invalid or has expired. Please try signing up again.
              </p>
            </div>

            <button
              onClick={() => navigate("/signUp")}
              className="w-full bg-[rgb(13,145,101)] text-white py-2 px-4 rounded-sm hover:bg-[rgb(23,184,131)] transition duration-200"
            >
              Sign Up Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
