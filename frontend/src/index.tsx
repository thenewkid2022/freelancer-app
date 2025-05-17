import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import * as locales from 'date-fns/locale';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// TypeScript-Deklaration für navigator.standalone
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CustomThemeProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locales.de}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </LocalizationProvider>
        </CustomThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
); 