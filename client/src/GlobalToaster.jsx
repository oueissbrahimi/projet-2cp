import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useTheme } from "./ThemeContext";

export default function GlobalToaster() {
  const { isDarkMode } = useTheme();
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <Toaster
      className="app-toaster"
      position={isDesktop ? "top-right" : "top-center"}
      theme={isDarkMode ? "dark" : "light"}
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "toast-card",
          title: "toast-title",
          description: "toast-description",
          actionButton: "toast-action",
          cancelButton: "toast-cancel",
        },
      }}
      style={{ zIndex: 99999 }}
    />
  );
}
