import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SideBar from "./StaticLayout/SideBar";
import Logo from "../../assets/Frame 8687 (1).png";
import RightBar from "./StaticLayout/RightBar";
import MobileSideBar from "./StaticLayout/MobileSideBar";
import BurgerMenu from "../components/BurgerMenu";

const PageLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ✅ Mobile Burger and Sidebar */}
      <div className="lg:hidden relative">
        <div className="fixed top-4 right-4 z-50">
          <BurgerMenu  toggle={toggleMobileMenu} />
        </div>

        <MobileSideBar isOpen={isMobileMenuOpen} onClose={toggleMobileMenu} />
      </div>

      {/* ✅ Desktop Sidebar */}
      <SideBar />

      {/* ✅ Main Content */}
      <main className="flex-1 flex flex-col py-4 sm:py-6 max-w-full">
        <div className="mb-3 w-full lg:hidden flex items-center justify-between px-4">
          <img
            src={Logo}
            alt="Logo"
            onClick={() => navigate("/")}
            className="w-[125px] object-contain cursor-pointer"
          />
        </div>

        <div className="flex-1 overflow-y-auto max-h-screen">
          <Outlet />
        </div>
      </main>

      <RightBar />
    </div>
  );
};

export default PageLayout;
