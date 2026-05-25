import { useContext } from "react";
import { ThemeContext, ThemeState } from "../state/ThemeContext";

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
