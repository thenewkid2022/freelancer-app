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

// TypeScript-Deklaration für navigator.standalone
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// Dynamische Viewport-Höhe für mobile Geräte
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const IPHONE_15_PWA_HEIGHT = 1132; // Höhe für iPhone 15 im PWA-Modus

function setViewportHeight() {
  console.log('setViewportHeight function called');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const effectiveSafeAreaInsetBottom = isStandalone ? 34 : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '20', 10) || 20;
  let viewportHeight = window.visualViewport?.height || window.innerHeight;
  if (isStandalone) {
    viewportHeight = IPHONE_15_PWA_HEIGHT;
  }
  let vh = Math.max(viewportHeight, 0) * 0.01;
  // Sicherstellen, dass vh einen sinnvollen Wert hat
  vh = Math.min(Math.max(vh, 0.1), 100); // Mindestens 0.1vh, maximal 100vh
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--effective-safe-area-inset-bottom', `${effectiveSafeAreaInsetBottom}px`);
  const appliedValue = getComputedStyle(document.documentElement).getPropertyValue('--effective-safe-area-inset-bottom').trim();
  console.log('Applied Effective Safe Area Bottom (Computed):', appliedValue);
  console.log('Adjusted Viewport Height:', vh * 100, 'px', 'Effective Safe Area Bottom:', effectiveSafeAreaInsetBottom, 'px', 'Raw Viewport Height:', viewportHeight, 'px', 'Is Standalone:', isStandalone);
}

const debouncedSetViewportHeight = debounce(setViewportHeight, 100);
window.addEventListener('resize', debouncedSetViewportHeight);
window.addEventListener('orientationchange', debouncedSetViewportHeight);
window.addEventListener('scroll', debouncedSetViewportHeight);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', debouncedSetViewportHeight);
}
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