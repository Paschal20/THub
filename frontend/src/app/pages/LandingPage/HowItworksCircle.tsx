import React from "react";
import { HiUser, HiCog, HiBolt } from "react-icons/hi2";

interface HowItWorksProps {
  step: string;
  title: string;
  description: string;
  delay?: string;
  inView?: boolean;
  icon?: "user" | "settings" | "bolt";
}

const HowItWorksCircle: React.FC<HowItWorksProps> = ({
  step,
  title,
  description,
  delay = "0",
  inView = false,
  icon = "user",
}) => {
  const renderIcon = () => {
    switch (icon) {
      case "user":
        return <HiUser size={36} color="#0d9165" />;
      case "settings":
        return <HiCog size={36} color="#0d9165" />;
      case "bolt":
        return <HiBolt size={36} color="#0d9165" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex flex-col items-center text-center w-[220px] md:w-[240px] lg:w-[250px] relative transition-all duration-700 ease-out`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
      }}
    >
      <div className="relative w-[90px] h-[90px] rounded-full bg-[#e8f4f1] flex items-center justify-center mb-5 shadow-md hover:scale-105 transition-transform duration-300">
        <span className="absolute -top-3 -left-3 w-[26px] h-[26px] flex items-center justify-center rounded-full bg-[#0d9165] text-white text-sm font-semibold">
          {step}
        </span>
        {renderIcon()}
      </div>

      <h3 className="font-inter font-semibold md:text-[15px] lg:text-[18px] text-[#102844] mb-2">
        {title}
      </h3>
      <p className="font-inter text-[15px] md:text-[14px] lg:text-[16px] text-[#767278] leading-6">
        {description}
      </p>
    </div>
  );
};

export default HowItWorksCircle;
