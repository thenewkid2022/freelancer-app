import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '../theme';

interface ThemeContextProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  darkMode: false,
  setDarkMode: () => {},
});

const getInitialDarkMode = (): boolean => {
  // Immer false als Standard, bis die Benutzereinstellungen geladen sind
  return false;
};

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode());
  const [isInitialized, setIsInitialized] = useState(false);

  // System-Präferenz als Fallback
  useEffect(() => {
    if (!isInitialized) {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode === null) {
        // Nur wenn keine Benutzereinstellungen vorhanden sind, System-Präferenz verwenden
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}; 