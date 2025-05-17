import { debounce } from './debounce';

export const setViewportHeight = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const vh = Math.max(viewportHeight, 0) * 0.01;
  
  // Sicherstellen, dass vh einen sinnvollen Wert hat
  const safeVh = Math.min(Math.max(vh, 0.1), 100);
  document.documentElement.style.setProperty('--vh', `${safeVh}px`);
  
  // Safe Area Berechnung - unverändert lassen
  const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0', 10);
  const effectiveSafeAreaBottom = isStandalone ? Math.max(34, safeAreaBottom) : safeAreaBottom;
  document.documentElement.style.setProperty('--effective-safe-area-inset-bottom', `${effectiveSafeAreaBottom}px`);
};

// Event-Listener zentralisieren
export const setupViewportListeners = () => {
  const debouncedSetVh = debounce(setViewportHeight, 100);
  
  setViewportHeight(); // Initial setzen
  
  const events = ['resize', 'orientationchange', 'scroll', 'visibilitychange'];
  events.forEach(event => window.addEventListener(event, debouncedSetVh));
  
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', debouncedSetVh);
  }
  
  return () => {
    events.forEach(event => window.removeEventListener(event, debouncedSetVh));
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', debouncedSetVh);
    }
  };
}; 