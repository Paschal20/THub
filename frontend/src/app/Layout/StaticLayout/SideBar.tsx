import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../../../assets/Frame 8687 (1).png";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { BsChatSquareText } from "react-icons/bs";
import { IoDocumentTextOutline } from "react-icons/io5";
import { MdOutlineQuiz } from "react-icons/md";
import { GoHistory } from "react-icons/go";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useState } from "react";
import SignOutModal from "../../pages/AuthPages/logoutModal";
import { AiOutlineSchedule } from "react-icons/ai";

const SideBar: React.FC = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const chatCount = useSelector(
    (state: RootState) => state.chat.chatHistory.length
  );

  return (
    <>
      <aside className="w-50 bg-white border-r hidden lg:block border-gray-100 flex-col py-6 px-4">
        <div className="flex items-center mb-8">
          <img
            src={Logo}
            alt="Logo"
            className="w-[125px] mr-2 object-fill cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>

        <nav className="flex-1">
          <ul className="space-y-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive
                  ? "bg-green-100 text-green-700 font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-700"
              }
            >
              <li className="flex items-center px-3 py-2 hover:bg-green-100 rounded-lg  cursor-pointer transition duration-300 hidden lg:block">
                <AiOutlineSchedule className="mr-2" />
                <span>My Schedule</span>
              </li>
            </NavLink>

            <NavLink
              to="/dashboard/events"
              className={({ isActive }) =>
                `${isActive
                  ? "bg-green-100 text-green-700 font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-700"}`
              }
            >
              <li className="flex items-center px-3 py-2 hover:bg-green-100 rounded-lg  cursor-pointer transition duration-300 xl:hidden">
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
            >
              <li className="flex items-center px-3 py-2 hover:bg-green-100 rounded-lg  cursor-pointer transition duration-300">
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
            >
              <li className="flex items-center px-3 py-2 hover:bg-green-100 rounded-lg  cursor-pointer transition duration-300">
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
            >
              <li className="flex items-center px-3 py-2 hover:bg-green-100 rounded-lg  cursor-pointer transition duration-300">
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
             >
               <li className="flex items-center px-3 py-2 hover:bg-green-100 rounded-lg  cursor-pointer transition duration-300">
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
            >
              <li className="flex items-center px-3 py-2 hover:bg-green-100 rounded-lg  cursor-pointer transition duration-300">
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
            >
              <li className="flex items-center px-3 py-2 cursor-pointer hover:bg-green-100 rounded-lg transition duration-300">
                <IoSettingsOutline className="mr-2" />
                <span>Setting</span>
              </li>
            </NavLink>

            <li
              className="flex items-center px-3 py-2 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg cursor-pointer transition duration-300"
              onClick={() => setShowLogoutModal(true)}
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

export default SideBar;
