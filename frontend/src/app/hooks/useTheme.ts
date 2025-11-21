// hooks/useTheme.ts
import { setFontSize, toggleTheme } from "../../Features/theme/themeSlice";
import { useAppDispatch, useAppSelector } from "./hooks";



export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);

  return {
    mode: theme.mode,
    fontSize: theme.fontSize,
    toggleTheme: () => dispatch(toggleTheme()),
    setFontSize: (size: number) => dispatch(setFontSize(size)),
    isDark: theme.mode === "dark",
    isLight: theme.mode === "light",
  };
};
