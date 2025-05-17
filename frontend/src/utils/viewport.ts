import { debounce } from './debounce';

export const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

export const setupViewportListeners = () => {
  const debouncedSetVh = debounce(setViewportHeight, 100);
  
  setViewportHeight(); // Initial setzen
  
  window.addEventListener('resize', debouncedSetVh);
  window.addEventListener('orientationchange', setViewportHeight);
  document.addEventListener('visibilitychange', setViewportHeight);
  
  return () => {
    window.removeEventListener('resize', debouncedSetVh);
    window.removeEventListener('orientationchange', setViewportHeight);
    document.removeEventListener('visibilitychange', setViewportHeight);
  };
}; 