import React from "react";
import aboutImage from "../../../assets/Frame 2610611.png";
import { FiCheckCircle } from "react-icons/fi";
import { useActiveSection } from "./SectionContext";
import { useInView } from "react-intersection-observer";
import Button from "../../../Components/Button";
import { useNavigate } from "react-router-dom";

const About: React.FC = () => {
  const navigate = useNavigate();
  const { activeSection } = useActiveSection();
  const isActive = activeSection === "about";

  const { ref: imgRef, inView: imgInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const { ref: textRef, inView: textInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div
      id="about"
      className="w-full flex flex-col justify-around items-center py-6 lg:py-10 overflow-x-hidden"
    >
      <div className="relative mb-10 leading-10">
        <h1
          className={`font-inter font-bold text-[28px] md:text-[32px] lg:text-[36px] ${
            isActive ? "text-[#0d9165]" : "text-[#102844]"
          }`}
        >
          ABOUT
        </h1>
        <div
          className={`absolute left-0 h-[3px] bg-[#0d9165] transition-all duration-700 ease-out ${
            isActive ? "w-full" : "w-0"
          }`}
        ></div>
      </div>

      <div className="w-[85%] bg-[#0d9165] rounded-t-[30px] flex flex-col md:flex-row justify-between items-center p-6 md:py-9 md:px-12 lg:py-9 gap-10 md:gap-16">
        <div
          ref={imgRef}
          className={`w-full md:w-[45%] flex justify-center items-center ${
            imgInView
              ? "animate__animated animate__slideInLeft custom-duration"
              : ""
          }`}
        >
          <img
            src={aboutImage}
            alt="About illustration"
            className="w-full max-w-[450px] h-auto object-contain"
          />
        </div>

        <div
          ref={textRef}
          className={`w-full md:w-[50%] text-white ${
            textInView
              ? "animate__animated animate__slideInRight custom-duration"
              : ""
          }`}
        >
          <h2 className="font-bold text-[20px] text-center md:text-left lg:text-[30px] mb-3 lg:md-4">
            Stay Organized & Productive
          </h2>
          <p className="font-poppins font-normal text-[14px] text-center md:text-left lg:text-[16px] leading-6 lg:leading-7 mb-4 lg:mb-6">
            Whether you're a student, professional, or entrepreneur, our app
            helps you stay organized, manage time better, and reduce stress.
            With AI-powered reminders, all-in-one material storage, and
            intuitive tools, you can focus on what really matters achieving your
            goals efficiently.
          </p>

          <ul className="space-y-2 lg:space-y-3 text-[14px] lg:text-[15px]">
            <li className="flex items-start gap-2">
              <FiCheckCircle className="text-white text-lg md:text-xl flex-shrink-0 mt-0.5" />
              <span>Smart Reminders & Task Organization</span>
            </li>

            <li className="flex items-start gap-2">
              <FiCheckCircle className="text-white text-lg md:text-xl flex-shrink-0 mt-0.5" />
              <span>Seamless Material Management in One Place</span>
            </li>

            <li className="flex items-start gap-2">
              <FiCheckCircle className="text-white text-lg md:text-xl flex-shrink-0 mt-0.5" />
              <span>AI Support to Simplify Your Daily Workflow</span>
            </li>

            <li className="flex items-start gap-2">
              {" "}
              <FiCheckCircle className="text-white text-lg md:text-xl flex-shrink-0 mt-0.5" />
              <span>Customizable Settings for Personalized Use</span>
            </li>
          </ul>

          <div className="text-center md:text-left">
            <Button
              text="Get Started"
              onClick={() => navigate("/signUp")}
              className="bg-white mt-3 md:mt-4 text-green-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
