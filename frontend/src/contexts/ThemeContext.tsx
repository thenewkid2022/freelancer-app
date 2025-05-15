import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  darkMode: false,
  setDarkMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

const getInitialDarkMode = () => {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) return stored === 'true';
  // Fallback: System-Preference
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode());

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: darkMode ? '#90caf9' : '#1976d2',
          light: darkMode ? '#e3f2fd' : '#42a5f5',
          dark: darkMode ? '#42a5f5' : '#1565c0',
          contrastText: darkMode ? '#000000' : '#ffffff',
        },
        secondary: {
          main: darkMode ? '#ce93d8' : '#9c27b0',
          light: darkMode ? '#f3e5f5' : '#ba68c8',
          dark: darkMode ? '#ab47bc' : '#7b1fa2',
          contrastText: darkMode ? '#000000' : '#ffffff',
        },
        background: {
          default: darkMode ? '#121212' : '#f5f5f5',
          paper: darkMode ? '#1e1e1e' : '#ffffff',
        },
        text: {
          primary: darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
        },
        divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      },
      typography: {
        fontFamily: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ].join(','),
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              scrollbarColor: darkMode ? "#6b6b6b #2b2b2b" : "#c1c1c1 #f1f1f1",
              "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                backgroundColor: darkMode ? "#2b2b2b" : "#f1f1f1",
                width: 8,
                height: 8,
              },
              "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                borderRadius: 8,
                backgroundColor: darkMode ? "#6b6b6b" : "#c1c1c1",
                minHeight: 24,
                border: darkMode ? "2px solid #2b2b2b" : "2px solid #f1f1f1",
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              transition: 'background-color 0.3s ease-in-out',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              boxShadow: darkMode 
                ? '0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)'
                : '0 2px 4px rgba(0,0,0,0.1)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              transition: 'background-color 0.3s ease-in-out, transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              transition: 'background-color 0.3s ease-in-out',
              backgroundImage: 'none',
            },
          },
        },
      },
    }),
    [darkMode]
  );

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}; 