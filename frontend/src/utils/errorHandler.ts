import toast from "react-hot-toast";

export interface ApiError {
  status?: number;
  data?: {
    message?: string;
  };
  error?: string;
}

export const handleApiError = (err: ApiError) => {
  const status = err?.status;
  const message =
    err?.data?.message ||
    err?.error ||
    "Something went wrong. Please try again.";

  // Check for network errors (when backend server is not running)
  if (
    err?.error?.includes("Failed to fetch") ||
    err?.error?.includes("TypeError")
  ) {
    return "Unable to connect to the server. Please check your internet connection or try again later.";
  }

  switch (status) {
    case 400:
      // Use the specific backend message for 400 errors (validation, invalid credentials, etc.)
      return message;
    case 401:
      return "Unauthorized. Please log in again.";
    case 403:
      return "Please verify your email before logging in.";
    case 404:
      return "Account not found. Please sign up first.";
    case 409:
      return "Email already exists. Please log in instead.";
    case 422:
      return "Validation failed. Please check your input.";
    case 500:
      return "Server unavailable. Try again later.";
    default:
      // fallback to the backend message if it’s not a known status
      return message;
  }
};

export const showApiError = (err: ApiError) => {
  const errorMessage = handleApiError(err);
  toast.error(errorMessage);
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }
};
