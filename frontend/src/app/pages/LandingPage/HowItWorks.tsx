import React from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import HowItWorksCircle from "./HowItworksCircle";
import Button from "../../../Components/Button";
import { useActiveSection } from "./SectionContext";


const HowItWorks: React.FC = () => {
  const navigate = useNavigate();
  const { activeSection } = useActiveSection();
  const isActive = activeSection === "how-it-works";

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <section
      id="how-it-works"
      className="w-full flex flex-col justify-around items-center py-6 lg:py-10 px-4 sm:px-6 md:px-10 overflow-x-hidden bg-white"
      ref={ref}
    >
      <div className="relative mb-10 leading-10 text-center md:text-left transition-all duration-700 ">
        <h1
          className={`font-inter font-bold text-xl md:text-[32px] lg:text-[36px] ${
            isActive ? "text-[#0d9165]" : "text-[#102844]"
          }`}
        >
          HOW IT WORKS
        </h1>

        <div
          className={`absolute left-0 h-[3px] bg-[#0d9165] transition-all duration-700 ease-out ${
            isActive ? "w-full" : "w-0"
          }`}
        ></div>
      </div>

      <p className="font-inter text-[15px] md:text-[14px] lg:text-[16px] text-[#767278] leading-6 md:w-[70%] font-inter mx-auto mb-12 text-center">
        Our platform makes learning simple. Follow three easy steps to set up
        your account, organize your schedule, and start achieving your goals
        with smart tools designed to help you stay on track
      </p>

      <div
        className={`relative flex flex-col md:flex-row items-center justify-center gap-16 md:gap-20 w-full max-w-5xl transition-all duration-700 delay-200 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <svg
          className="hidden md:block absolute top-[30px] left-0 w-full h-[120px] pointer-events-none"
          viewBox="0 0 1000 150"
          preserveAspectRatio="none"
        >
          <path
            d="M250,100 C400,0 600,0 750,80"
            stroke="#bdbdbd"
            strokeWidth="2"
            strokeDasharray="6,6"
            fill="none"
            style={{
              strokeDasharray: "1000",
              strokeDashoffset: inView ? "0" : "1000",
              transition: "stroke-dashoffset 1.8s ease-in-out",
            }}
          />
        </svg>

        <HowItWorksCircle
          step="1"
          title="Register"
          description="Create your account in seconds"
          delay="300"
          inView={inView}
          icon="user"
        />

        <HowItWorksCircle
          step="2"
          title="Complete Setup"
          description="Add your timetable, upload notes, set reminders."
          delay="600"
          inView={inView}
          icon="settings"
        />

        <HowItWorksCircle
          step="3"
          title="Start Learning"
          description="Get AI help and take quizzes to stay sharp"
          delay="900"
          inView={inView}
          icon="bolt"
        />
      </div>

      <div className="mt-10">
        <Button text="Get Started" onClick={() => navigate("/signUp")} />
      </div>
    </section>
  );
};

export default HowItWorks;
