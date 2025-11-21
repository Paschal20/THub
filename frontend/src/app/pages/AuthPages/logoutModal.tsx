import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../hooks/hooks";
import { clearCredentials } from "../../../Features/auth/authSlice";
import { clearAllChats } from "../../../Features/ChatSlice/ChatSlice";

interface SignOutModalProps {
  onClose?: () => void;
}

export default function SignOutModal({ onClose }: SignOutModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(clearCredentials());
    dispatch(clearAllChats());
    toast.success("You have been logged out successfully");
    onClose?.();
    navigate("/", { replace: true });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full text-lg">
            ⚠
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">Log out</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to sign out of your account?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 cursor-pointer text-white rounded-lg hover:bg-red-700"
          >
            Log out
          </button>
          <button
            onClick={() => onClose?.()}
            className="px-4 py-2 bg-gray-200 cursor-pointer text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
