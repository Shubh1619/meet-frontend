import React, { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) {
    return { darkMode: false, toggleDarkMode: () => {} };
  }
  return context;
}

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}
