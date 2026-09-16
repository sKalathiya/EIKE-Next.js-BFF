"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/stores/theme-store";
import { ToastViewport } from "@/components/site/toast-viewport";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useThemeStore.persist.rehydrate();
  }, []);

  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
