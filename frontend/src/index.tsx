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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Dynamische Viewport-Höhe für mobile Geräte
function setViewportHeight() {
  console.log('setViewportHeight function called'); // Bestätigung der Ausführung
  const safeAreaInsetBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0', 10) || 0;
  let vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight) - safeAreaInsetBottom;
  vh = Math.max(vh, 0); // Sicherstellen, dass vh nicht negativ wird
  vh = vh * 0.01; // Umrechnung in vh-Einheiten
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  console.log('Adjusted Viewport Height:', vh * 100, 'px', 'Safe Area Bottom:', safeAreaInsetBottom, 'px', 'Visual Viewport Height:', window.visualViewport ? window.visualViewport.height : window.innerHeight, 'px');
}
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);
window.addEventListener('scroll', setViewportHeight); // Für dynamische Anpassungen
setViewportHeight();

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