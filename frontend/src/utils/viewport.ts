import { debounce } from './debounce';

export const setViewportHeight = () => {
  // Sofortige Berechnung der Viewport-Höhe
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  
  // Sicherstellen, dass wir einen gültigen Wert haben
  if (viewportHeight <= 0) return;
  
  const vh = viewportHeight * 0.01;
  const safeVh = Math.min(Math.max(vh, 0.1), 100);
  
  // CSS-Variablen setzen
  document.documentElement.style.setProperty('--vh', `${safeVh}px`);
  
  // Safe Area Berechnung
  const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0', 10);
  const effectiveSafeAreaBottom = isStandalone ? Math.max(34, safeAreaBottom) : safeAreaBottom;
  
  // Beide Safe-Area-Variablen setzen
  document.documentElement.style.setProperty('--safe-area-bottom', `${effectiveSafeAreaBottom}px`);
  document.documentElement.style.setProperty('--effective-safe-area-inset-bottom', `${effectiveSafeAreaBottom}px`);
  
  // Debug-Ausgabe
  console.log('Viewport height updated:', {
    viewportHeight,
    vh: safeVh,
    safeAreaBottom: effectiveSafeAreaBottom
  });
};

// Event-Listener zentralisieren
export const setupViewportListeners = () => {
  const debouncedSetVh = debounce(setViewportHeight, 100);
  
  // Sofortige Initialisierung ohne Debounce
  setViewportHeight();
  
  // Verzögerte zweite Initialisierung für den Fall, dass die erste zu früh war
  setTimeout(setViewportHeight, 100);
  
  // Event-Listener mit Debounce für nachfolgende Änderungen
  const events = ['resize', 'orientationchange', 'scroll', 'visibilitychange'];
  events.forEach(event => window.addEventListener(event, debouncedSetVh));
  
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', debouncedSetVh);
  }
  
  // Zusätzlicher Event-Listener für den Load-Event
  window.addEventListener('load', setViewportHeight);
  
  return () => {
    events.forEach(event => window.removeEventListener(event, debouncedSetVh));
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', debouncedSetVh);
    }
    window.removeEventListener('load', setViewportHeight);
  };
}; 