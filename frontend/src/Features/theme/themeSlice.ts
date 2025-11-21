// Features/theme/themeSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ThemeState {
  mode: "light" | "dark";
  fontSize: number;
}

const initialState: ThemeState = {
  mode: "light",
  fontSize: 16,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },
  },
});

export const { toggleTheme, setFontSize } = themeSlice.actions;
export default themeSlice.reducer;
