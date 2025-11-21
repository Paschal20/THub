import React from "react";


interface ButtonProps {
  text: string | React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

const Button: React.FC<ButtonProps> = ({ text, className, onClick, disabled, size = "medium" }) => {
  const sizeClasses = {
    small: "px-5 py-2 lg:text-[16px] text-sm",
    medium: "md:px-5 py-1.5 px-7 md:py-1 lg:py-2 lg:px-9 text-base md:text-[18px]",
    large: "px-10 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${sizeClasses[size]} rounded-md bg-[#0d9165] font-inter text-[white]
        hover:rounded-[30px] hover:bg-white hover:text-[#0d9165] border hover:border-[#0d9165]
        transition-all duration-150 ease-in-out cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {text}
    </button>
  );
};

export default Button;
