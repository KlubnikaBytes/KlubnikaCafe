import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash, key, state } = useLocation();

  useEffect(() => {
    // 1. If we have a targetId in the state (passed from Navbar)
    if (state && state.targetId) {
      const elementId = state.targetId;
      
      // Create a polling mechanism to wait for the element to render
      const checkForElement = () => {
        const element = document.getElementById(elementId);
        if (element) {
          const navbarOffset = 80; // Height of your navbar
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - navbarOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        } else {
          // If element not found yet, try again in 100ms
          // We retry for up to 2 seconds to allow lazy loading to finish
          setTimeout(checkForElement, 100);
        }
      };

      // Start looking for the element
      checkForElement();
    } 
    // 2. If no targetId, just go to top (Standard behavior)
    else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, key, state]);

  return null;
};

export default ScrollToTop;