"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/stores/theme-store";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const night = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={night}
      aria-label={night ? "Switch to day view" : "Switch to night view"}
      title={night ? "Day view" : "Night view"}
      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {night ? <Sun className="size-4 animate-pop-in" /> : <Moon className="size-4 animate-pop-in" />}
    </button>
  );
}
