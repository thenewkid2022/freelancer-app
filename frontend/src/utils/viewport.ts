import { debounce } from './debounce';

export const setViewportHeight = () => {
  // Sofortige Berechnung der Viewport-Höhe
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
  // Sofortige Berechnung der Viewport-Höhe
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  
  // Sicherstellen, dass wir einen gültigen Wert haben
  if (viewportHeight <= 0) return;
  
  // Berechnung der Viewport-Höhe mit zusätzlicher Sicherheit
  const vh = viewportHeight * 0.01;
  const safeVh = Math.min(Math.max(vh, 0.1), 100);
  
  // CSS-Variablen setzen
  document.documentElement.style.setProperty('--vh', `${safeVh}px`);
  document.documentElement.style.setProperty('--actual-vh', `${viewportHeight}px`);
  
  // Verbesserte Safe Area Berechnung für iOS
  const safeAreaBottom = parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-area-inset-bottom') || '0',
    10
  );
  
  // Angepasste Safe-Area-Berechnung für iOS
  const effectiveSafeAreaBottom = isStandalone 
    ? Math.max(34, safeAreaBottom) 
    : Math.max(0, safeAreaBottom);
  
  // Beide Safe-Area-Variablen setzen
  document.documentElement.style.setProperty('--safe-area-bottom', `${effectiveSafeAreaBottom}px`);
  document.documentElement.style.setProperty('--effective-safe-area-inset-bottom', `${effectiveSafeAreaBottom}px`);
  
  // Neue CSS-Variable für die Tastatur-Höhe
  const keyboardHeight = window.visualViewport 
    ? window.innerHeight - window.visualViewport.height 
    : 0;
  document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
};

// Optimierte Event-Listener-Konfiguration
export const setupViewportListeners = () => {
  // Sofortige Initialisierung
  setViewportHeight();
  
  // Verzögerte Initialisierungen für verschiedene iOS-Szenarien
  const initialDelays = [100, 300, 500];
  initialDelays.forEach(delay => setTimeout(setViewportHeight, delay));
  
  // Debounced Version für kontinuierliche Updates
  const debouncedSetVh = debounce(setViewportHeight, 100);
  
  // Erweiterte Event-Listener-Liste
  const events = [
    'resize',
    'orientationchange',
    'scroll',
    'visibilitychange',
    'focusin',
    'focusout',
    'blur',  // Neu: Für bessere Tastatur-Handling
    'resize', // Neu: Für bessere Tastatur-Handling
  ];
  
  events.forEach(event => window.addEventListener(event, debouncedSetVh));
  
  // Visual Viewport Events mit sofortiger Reaktion
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setViewportHeight);
    window.visualViewport.addEventListener('scroll', setViewportHeight);
  }
  
  // Zusätzliche Event-Listener
  window.addEventListener('load', setViewportHeight);
  
  // Cleanup-Funktion
  return () => {
    events.forEach(event => window.removeEventListener(event, debouncedSetVh));
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', setViewportHeight);
      window.visualViewport.removeEventListener('scroll', setViewportHeight);
    }
    window.removeEventListener('load', setViewportHeight);
  };
}; 