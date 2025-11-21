import React from "react";
import { MdOutlineEmail } from "react-icons/md";
import { BsTelephone } from "react-icons/bs";
import { PiWhatsappLogo, PiNoteLight } from "react-icons/pi";
import { useActiveSection } from "./SectionContext";
import { useInView } from "react-intersection-observer";
import Button from "../../../Components/Button";

const Contact: React.FC = () => {
  const { activeSection } = useActiveSection();
  const isActive = activeSection === "contact";

  const { ref: leftRef, inView: leftInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div
      id="contact"
      className="w-full flex flex-col justify-around items-center py-6 lg:py-10 px-6 md:px-10 overflow-x-hidden"
    >
      <div className="relative mb-10 leading-10 text-center md:text-left">
        <h1
          className={`font-inter font-bold text-xl md:text-[32px] lg:text-[36px] ${
            isActive ? "text-[#0d9165]" : "text-[#102844]"
          }`}
        >
          CONTACT
        </h1>
        <div
          className={`absolute left-0 h-[3px] bg-[#0d9165] transition-all duration-700 ease-out ${
            isActive ? "w-full" : "w-0"
          }`}
        ></div>
      </div>

      <div className="w-full md:w-[90%] lg:w-[90%] flex flex-col gap-5 justify-center">
        <div
          ref={leftRef}
          className={`bg-white w-full flex flex-col rounded-lg shadow-sm px-6 lg:px-16 py-6 transition duration-300 transform hover:scale-105 hover:shadow-lg ${
            leftInView ? "animate_animated animateslideInLeft animate_slow" : ""
          }`}
        >
          <div className="flex flex-col md:flex-row md:flex-wrap md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <MdOutlineEmail className="text-[#0d9165] text-xl md:text-2xl lg:text-3xl flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-[#0F161E] font-inter text-[15px] md:text-[16px] lg:text-[18px]">
                  Email Us
                </h3>
                <p className="text-[#767278] font-inter text-[13px] md:text-[14px] lg:text-[15px] break-words">
                  omotolaniadele242@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <PiWhatsappLogo className="text-[#0d9165] text-xl md:text-2xl lg:text-3xl flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-[#0F161E] font-inter text-[15px] md:text-[16px] lg:text-[18px]">
                  Chat on WhatsApp
                </h3>
                <p className="text-[#767278] font-inter text-[13px] md:text-[14px] lg:text-[15px]">
                  Quick replies during the day.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 ">
              <BsTelephone className="text-[#0d9165] text-lg md:text-xl lg:text-2xl flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-[#0F161E] font-inter text-[15px] md:text-[16px] lg:text-[18px]">
                  Call Us
                </h3>
                <p className="text-[#767278] font-inter text-[13px] md:text-[14px] lg:text-[15px]">
                  09026662785
                </p>
              </div>
            </div>
          </div>
        </div>
        <div
          ref={leftRef}
          className={`bg-white w-full flex flex-col rounded-lg shadow-sm px-6 lg:px-16 py-6 transition duration-300 transform hover:scale-105 hover:shadow-lg ${
            leftInView ? "animate_animated animateslideInLeft animate_slow" : ""
          }`}
        >
          <div className="flex flex-col ">
            <div className="w-full flex gap-3 ">
              <PiNoteLight className="text-[#0d9165] text-xl md:text-2xl lg:text-3xl flex-shrink-0 mt-1" />
              <div className="w-full flex flex-col">
                <h3 className="font-semibold text-[#0F161E] font-inter text-[15px] md:text-[16px] lg:text-[18px]">
                  Send Feedback
                </h3>
                <p className="text-[#767278] font-inter text-[13px] md:text-[14px] lg:text-[15px] mb-3">
                  Quick replies during the day.
                </p>
              </div>
            </div>
            <div className="flex flex-col w-full gap-3">
              <textarea
                placeholder="Write here..."
                className="border text-[#0d9165] rounded-md resize-none p-3 text-[13px] outline-none h-[120px] md:h-[140px] lg:h-[110px] focus:ring-1 focus:ring-[#0d9165] w-full"
              ></textarea>

              <div className="flex justify-start md:items-end w-full md:w-auto">
                <Button text="Submit" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
