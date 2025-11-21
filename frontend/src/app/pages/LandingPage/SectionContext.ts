import { createContext, useContext } from "react";
import { ACTIVE_SECTION_DEFAULT } from "./constants";

interface ActiveSectionContextType {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const ActiveSectionContext = createContext<ActiveSectionContextType>({
  activeSection: ACTIVE_SECTION_DEFAULT,
  setActiveSection: () => {},
});

export const useActiveSection = () => useContext(ActiveSectionContext);
