import React from "react";
import FeaturesBox from "./FeaturesBox";
import timeTable from "../../../assets/Rectangle 12.png";
import Reminder from "../../../assets/Rectangle 6.png";
import upload from "../../../assets/Rectangle 14.png";
import quizes from "../../../assets/Rectangle 10.png";
import ai from "../../../assets/Rectangle 15.png";
import { useActiveSection } from "./SectionContext";

const Features: React.FC = () => {
  const { activeSection } = useActiveSection();
  const isActive = activeSection === "features";
  return (
    <div
      id="features"
      className="w-full flex flex-col justify-around items-center py-6 lg:py-10 bg-[#fafafa]"
    >
      <div className="relative mb-10 leading-10">
        <h1
          className={`font-inter font-bold text-xl md:text-[32px] lg:text-[36px] ${
            isActive ? "text-[#0d9165]" : "text-[#102844]"
          }`}
        >
          FEATURES
        </h1>

        <div
          className={`absolute left-0 h-[3px] bg-[#0d9165] transition-all duration-700 ease-out ${
            isActive ? "w-full" : "w-0"
          }`}
        ></div>
      </div>

      <div className="w-[85%] grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 justify-between items-center gap-6">
        <FeaturesBox
          image={timeTable}
          title="Timetable Management"
          description="Stay in control of your studies with a timetable tailored to you plan subjects."
        />
        <FeaturesBox
          image={Reminder}
          title="Reminders"
          description="Set reminders for tasks, timetables, or materials and stay on track"
        />
        <FeaturesBox
          image={upload}
          title="Upload & Access Materials"
          description="Upload your notes and study guides, and access them anytime, anywhere."
        />
        <FeaturesBox
          image={quizes}
          title="Smart Quizzes"
          description="Start quizzes based on your materials, subjects, topics, or random questions"
        />
        <FeaturesBox
          image={ai}
          title="AI Assistant"
          description="Get quick answers, explanations, and study help from AI."
        />
      </div>
    </div>
  );
};

export default Features;
