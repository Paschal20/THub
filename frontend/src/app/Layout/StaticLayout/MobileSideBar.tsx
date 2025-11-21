import { NavLink } from "react-router-dom";
// import Logo from "../../../assets/Frame 8687 (1).png";
import { IoSettingsOutline, IoLogOutOutline, IoDocumentTextOutline, IoClose } from "react-icons/io5";
import { BsChatSquareText } from "react-icons/bs";
import { MdOutlineQuiz } from "react-icons/md";
import { GoHistory } from "react-icons/go";
import { AiOutlineSchedule } from "react-icons/ai";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useState, useEffect } from "react";
import SignOutModal from "../../pages/AuthPages/logoutModal";

interface MobileSideBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSideBar: React.FC<MobileSideBarProps> = ({ isOpen, onClose }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // const navigate = useNavigate();
  const chatCount = useSelector((state: RootState) => state.chat.chatHistory.length);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <>
      {/* ✅ Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* ✅ Sidebar */}
      <aside
        className={`fixed top-0 right-0 w-56 h-screen bg-white border-l border-gray-100 flex flex-col py-6 px-5 z-50 transform transition-transform duration-500 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ Logo only (removed inner X icon) */}
        <div className="flex items-center justify-end mb-8">
          {/* <img
            src={Logo}
            alt="Logo"
            className="w-[120px] object-contain cursor-pointer"
            onClick={() => {
              navigate("/");
              onClose();
            }}
          /> */}


            <button
    onClick={onClose}
    className="p-2 rounded-md bg-white text-green-700 shadow border"
  >
    <IoClose size={24} />
  </button>
        </div>

        {/* ✅ Nav Links */}
        <nav className="flex-1">
          <ul className="space-y-4 text-[15px]">
            <NavLink
              to="/dashboard/events"
              className={({ isActive }) =>
                isActive
                  ? "bg-green-100 text-green-700 font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-700"
              }
              onClick={onClose}
            >
              <li className="flex items-center px-3 py-2 rounded-lg cursor-pointer transition duration-300">
                <AiOutlineSchedule className="mr-2" />
                <span>Event Management</span>
              </li>
            </NavLink>

            <NavLink
              to="/dashboard/chat"
              className={({ isActive }) =>
                isActive
                  ? "bg-green-100 text-green-700 font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-700"
              }
              onClick={onClose}
            >
              <li className="flex items-center px-3 py-2 rounded-lg cursor-pointer transition duration-300">
                <BsChatSquareText className="mr-2" />
                <span>Ai Chat</span>
                {chatCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white rounded-full px-2 text-xs">
                    {chatCount}
                  </span>
                )}
              </li>
            </NavLink>

            <NavLink
              to="/dashboard/upload"
              className={({ isActive }) =>
                isActive
                  ? "bg-green-100 text-green-700 font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-700"
              }
              onClick={onClose}
            >
              <li className="flex items-center px-3 py-2 rounded-lg cursor-pointer transition duration-300">
                <IoDocumentTextOutline className="mr-2" />
                <span>Uploads</span>
              </li>
            </NavLink>

            <NavLink
              to="/dashboard/quiz"
              className={({ isActive }) =>
                isActive
                  ? "bg-green-100 text-green-700 font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-700"
              }
              onClick={onClose}
            >
              <li className="flex items-center px-3 py-2 rounded-lg cursor-pointer transition duration-300">
                <MdOutlineQuiz className="mr-2" />
                <span>Quiz</span>
              </li>
            </NavLink>

            <NavLink
              to="/dashboard/cbt/subject"
              className={({ isActive }) =>
                isActive
                  ? "bg-green-100 text-green-700 font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-700"
              }
              onClick={onClose}
            >
              <li className="flex items-center px-3 py-2 rounded-lg cursor-pointer transition duration-300">
                <MdOutlineQuiz className="mr-2" />
                <span>CBT</span>
              </li>
            </NavLink>

            <NavLink
              to="/dashboard/history"
              className={({ isActive }) =>
                isActive
                  ? "bg-green-100 text-green-700 font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-700"
              }
              onClick={onClose}
            >
              <li className="flex items-center px-3 py-2 rounded-lg cursor-pointer transition duration-300">
                <GoHistory className="mr-2" />
                <span>History</span>
              </li>
            </NavLink>

            <NavLink
              to="/dashboard/setting"
              className={({ isActive }) =>
                isActive
                  ? "bg-green-100 text-green-700 font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-700"
              }
              onClick={onClose}
            >
              <li className="flex items-center px-3 py-2 rounded-lg cursor-pointer transition duration-300">
                <IoSettingsOutline className="mr-2" />
                <span>Setting</span>
              </li>
            </NavLink>

            <li
              className="flex items-center px-3 py-2 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg cursor-pointer transition duration-300"
              onClick={() => {
                setShowLogoutModal(true);
                onClose();
              }}
            >
              <IoLogOutOutline className="mr-2" />
              <span>Logout</span>
            </li>
          </ul>
        </nav>
      </aside>

      {showLogoutModal && (
        <SignOutModal onClose={() => setShowLogoutModal(false)} />
      )}
    </>
  );
};

export default MobileSideBar;
