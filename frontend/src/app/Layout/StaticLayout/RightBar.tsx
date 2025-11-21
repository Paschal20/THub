import React from "react";
import ProfileDropdown from "../../pages/Dashboard/profile";
import EventManagementPage from "../../pages/Dashboard/EventManagementPage"; // Import the new page component

const RightBar: React.FC = () => {
  return (
    <div className="xl:block hidden bg-white border border-gray-100 p-1 w-56 text-xs text-gray-900 transition-colors duration-200 overflow-y-auto">
      <div className="flex justify-between items-center">
        <ProfileDropdown />
      </div>
      {/* Render EventManagementPage content directly here for larger screens */}
      <EventManagementPage />
    </div>
  );
};

export default RightBar;