import React, { useState, useEffect } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import Logo from "../../../assets/Frame 8687 (1).png";
import Button from "../../../Components/Button";
import { useNavigate } from "react-router-dom";
import { useActiveSection } from "./SectionContext";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeSection, setActiveSection } = useActiveSection();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 125,
        behavior: "smooth",
      });
      setActiveSection(id);
    }
    setIsOpen(false);
  };

  // prevent background scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      const sections = [
        "home",
        "about",
        "features",
        "how-it-works",
        "benefits",
        "contact",
      ];

      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setActiveSection]);

  // handle click outside the sidebar to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      if (isOpen && sidebar && !sidebar.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <header className="w-full lg:h-[110px] h-[90px] fixed top-0 left-0 z-50 flex justify-center items-end bg-transparent backdrop-blur-sm">
      <div className="w-[85%] lg:h-[80px] md:h-[70px] h-[50px] bg-white shadow-[0px_3px_5px_rgba(0,0,0,0.04)] rounded-md flex justify-between items-center px-3 lg:px-5">
        <img
          src={Logo}
          alt="Logo"
          className="lg:w-[185px] w-[110px] h-auto cursor-pointer"
          onClick={() => scrollToSection("home")}
        />

        <ul
          className="
          hidden md:flex justify-between font-poppins text-[#3f3e3f] font-normal
          md:w-[350px] md:text-[12px]
          lg:w-[500px] lg:text-[16px]
        "
        >
          <li
            onClick={() => scrollToSection("home")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "home" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            Home
          </li>
          <li
            onClick={() => scrollToSection("about")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "about" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            About
          </li>
          <li
            onClick={() => scrollToSection("features")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "features" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            Features
          </li>
          <li
            onClick={() => scrollToSection("how-it-works")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "how-it-works"
                ? "text-[#0d9165] font-semibold"
                : ""
            }`}
          >
            How It Works
          </li>
          <li
            onClick={() => scrollToSection("benefits")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "benefits" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            Benefits
          </li>
          <li
            onClick={() => scrollToSection("contact")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "contact" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            Contact
          </li>
        </ul>

        <div className="hidden md:flex items-center gap-4">
          <Button text="Login" onClick={() => navigate("/login")} />
        </div>

        <div className="md:hidden flex items-center gap-2">
          <FiMenu
            className="text-[#0d9165] text-3xl cursor-pointer"
            onClick={() => setIsOpen(true)}
          />
        </div>
      </div>

      {/* Overlay for click outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden"></div>
      )}

      {/* Sidebar */}
      <div
        id="mobile-sidebar"
        className={`fixed top-0 right-0 h-screen w-[70%] max-w-[300px] bg-white shadow-xl transition-all duration-500 ease-in-out transform z-50 md:hidden overflow-y-auto ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <div className="flex justify-end p-4">
          <FiX
            className="text-[#0d9165] text-3xl cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
        </div>

        <ul className="flex flex-col items-center gap-6 py-6 font-poppins text-[#3f3e3f] text-[16px] font-[400]">
          <li
            onClick={() => scrollToSection("home")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "home" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            Home
          </li>
          <li
            onClick={() => scrollToSection("about")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "about" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            About
          </li>
          <li
            onClick={() => scrollToSection("features")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "features" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            Features
          </li>
          <li
            onClick={() => scrollToSection("how-it-works")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "how-it-works"
                ? "text-[#0d9165] font-semibold"
                : ""
            }`}
          >
            How It Works
          </li>
          <li
            onClick={() => scrollToSection("benefits")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "benefits" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            Benefits
          </li>
          <li
            onClick={() => scrollToSection("contact")}
            className={`hover:text-[#0d9165] transition-colors duration-300 cursor-pointer ${
              activeSection === "contact" ? "text-[#0d9165] font-semibold" : ""
            }`}
          >
            Contact
          </li>

          <Button text="Login" onClick={() => navigate("/login")} />
        </ul>
      </div>
    </header>
  );
};

export default Header;
