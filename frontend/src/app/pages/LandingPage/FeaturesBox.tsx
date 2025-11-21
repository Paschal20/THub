import React from "react";
import { useInView } from "react-intersection-observer";

interface FeaturesBoxProps {
  image?: string;
  title: string;
  description: string;
}

const FeaturesBox: React.FC<FeaturesBoxProps> = ({
  image,
  title,
  description,
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true, // Animation will only happen once
    threshold: 0.1, // Trigger when 10% of the element is visible
  });
  return (
    <div
      ref={ref}
      className={`w-full sm:w-[48%] md:w-[220px] lg:w-[260px] h-[370px] px-4  rounded-md flex flex-col items-center justify-around shadow-sm bg-white transform transition duration-300 hover:scale-105 hover:shadow-lg ${
        inView ? "animate__animated animate__slideInUp custom-duration" : ""
      }`}
    >
      <div className="w-full h-[200px] rounded-md overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover rounded-[10px]"
        />
      </div>


      <div className="flex flex-col text-left gap-2 mb-2">
        <h3 className="font-inter font-semibold md:text-[15px] lg:text-[18px] text-[#102844] text-left">
          {title}
        </h3>
        <p className="font-inter text-[15px] md:text-[14px] lg:text-[16px] text-[#767278] leading-6 overflow-hidden text-ellipsis line-clamp-3">
          {description}
        </p>
      </div>
    </div>
  );
};

export default FeaturesBox;
