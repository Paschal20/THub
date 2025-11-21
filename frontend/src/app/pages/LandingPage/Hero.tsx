import React, { useEffect, useState } from "react";
import Button from "../../../Components/Button";
import HeroImage from "../../../assets/Group 2 (1).png";
import { useNavigate } from "react-router-dom";

const Hero: React.FC = () => {
  const navigate = useNavigate();

  const texts = ["Preaparing for exam?", "Timely-Hub Got You", "Win Big."];
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false);
      setTimeout(() => {
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
        setAnimate(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className="w-full md:h-[400px] lg:h-[480px] h-auto lg:mt-[140px] md:mt-[80px] mt-[85px] flex justify-center items-center py-5">
      <div className="w-[85%] md:h-[440px] h-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6 lg:gap-10">
        <img
          src={HeroImage}
          alt="Hero"
          className="w-full max-w-[400px] md:w-[280px] lg:w-[470px] h-auto block md:hidden"
        />

        <div className="flex flex-col gap-4 md:gap-3 lg:gap-4 max-w-[520px] text-center md:text-left">
          <div>
            <h1
              className={`text-[#102844] font-inter font-bold text-2xl md:text-[32px] lg:text-[40px] leading-tight md:leading-snug lg:leading-snug transform transition-all duration-700 ease-in-out ${
                animate
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-5"
              }`}
            >
              {texts[currentTextIndex]}
            </h1>
            <p className="font-inter font-semibold text-[16px] md:text-[18px] lg:text-[20px] mt-4 text-[#0d9165] ">
              Practice. Learn. Excel.
            </p>
          </div>

          <p className="text-[#767278] font-poppins font-normal text-[14px] md:text-[15px] lg:text-[18px] leading-6 md:leading-7 lg:leading-8 hidden md:block">
            Turn your <span className="font-semibold text-[#102844]">EXAM</span>{" "}
            preparation into a winning experience with{" "}
            <span className="font-semibold text-[#102844]">Timely Hub</span>.{" "}
            Practice real exam questions, test your speed and accuracy, and
            track your progress as you grow more confident each day.{" "}
            <br className="hidden md:inline lg:flex" />
            With{" "}
            <span className="font-semibold text-[#102844]">Timely Hub</span>,
            you’re always one step closer to exam success.
          </p>

          <div className="flex justify-center mt-2 md:justify-start md:mt-1 lg:mt-2">
            <Button
              text="Start Practicing"
              onClick={() => navigate("/signUp")}
            />
          </div>
        </div>

        <img
          src={HeroImage}
          alt="Hero"
          className="w-[200px] md:w-[280px] lg:w-[470px] h-auto hidden md:block"
        />
      </div>
    </div>
  );
};

export default Hero;
