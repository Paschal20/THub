import React from "react";
import benefitImage from "../../../assets/Frame 2610614 .png";
import { LuDot } from "react-icons/lu";
import { useActiveSection } from "./SectionContext";
import { useInView } from "react-intersection-observer";

const Benefits: React.FC = () => {
  const { activeSection } = useActiveSection();
  const isActive = activeSection === "benefits";

  // Observer for text
  const { ref: textRef, inView: textInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Observer for image
  const { ref: imageRef, inView: imageInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div
      id="benefits"
      className="w-full flex flex-col justify-around items-center py-6 lg:py-10 bg-[#fafafa] overflow-x-hidden"
    >
      <div className="relative mb-10 leading-10">
        <h1
          className={`font-inter font-bold text-[28px] md:text-[32px] lg:text-[36px] ${
            isActive ? "text-[#0d9165]" : "text-[#102844]"
          }`}
        >
          BENEFITS
        </h1>

        <div
          className={`absolute left-0 h-[3px] bg-[#0d9165] transition-all duration-700 ease-out ${
            isActive ? "w-full" : "w-0"
          }`}
        ></div>
      </div>

      <div className="w-[85%] flex flex-col-reverse md:flex-row justify-center md:justify-between gap-8 md:gap-0 items-center py-6">
        <div
          ref={textRef}
          className={`md:w-[50%] flex flex-col justify-center gap-5 md:gap-3 lg:gap-5 ${
            textInView
              ? "animate__animated animate__slideInLeft custom-duration"
              : ""
          }`}
        >
          <h3 className="text-[#102844] font-inter font-bold text-[20px] text-center md:text-left md:text-[18px] lg:text-[22px]">
            Stay Organized, Stress-Free
          </h3>
          <p className="text-[#767278] flex items-start md:text-left font-inter font-medium text-[15px] md:text-[14px] lg:text-[17px]">
            <span>
              <LuDot size={30} />
            </span>{" "}
            Stay Organized – Plan your subjects and tasks with a clear
            timetable.
          </p>
          <p className="text-[#767278] flex items-start md:text-left font-inter font-medium text-[15px] md:text-[14px] lg:text-[17px]">
            <span>
              <LuDot size={30} />
            </span>{" "}
            Never Forget – Set reminders for assignments, materials, and
            classes.
          </p>
          <p className="text-[#767278] flex items-start  md:text-left font-inter font-medium text-[15px] md:text-[14px] lg:text-[17px]">
            <span>
              <LuDot size={30} />
            </span>{" "}
            All-in-One Access – Upload notes and study guides, available
            anytime.
          </p>
          <p className="text-[#767278] flex items-start  md:text-left font-inter font-medium text-[15px] md:text-[14px] lg:text-[17px]">
            <span>
              <LuDot size={30} />
            </span>{" "}
            Smarter Learning – Get instant help from AI and test yourself with
            quizzes.
          </p>
          <p className="text-[#767278] flex items-start md:text-left font-inter font-medium text-[15px] md:text-[14px] lg:text-[17px]">
            <span>
              <LuDot size={30} />
            </span>{" "}
            With us, studying becomes less stressful and more productive.
          </p>
        </div>

        <div
          ref={imageRef}
          className={`w-full md:w-[40%] flex justify-center items-center ${
            imageInView ? "animate__animated animate__slideInRight" : ""
          }`}
        >
          <img
            src={benefitImage}
            alt="About"
            className="w-full max-w-[450px] h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Benefits;
