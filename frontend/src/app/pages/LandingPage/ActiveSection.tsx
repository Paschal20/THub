import React, { useState } from "react";
import { ACTIVE_SECTION_DEFAULT } from "./constants";
import { ActiveSectionContext } from "./SectionContext";

export const ActiveSectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeSection, setActiveSection] = useState(ACTIVE_SECTION_DEFAULT);

  return (
    <ActiveSectionContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </ActiveSectionContext.Provider>
  );
};
