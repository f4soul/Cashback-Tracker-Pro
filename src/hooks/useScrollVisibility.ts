import { useState, useEffect } from 'react';

export function useScrollVisibility() {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const [navExpanded, setNavExpanded] = useState(true);

  // Handle header and nav visibility on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const isScrollingDown = currentScrollY > lastScrollY;

          if (currentScrollY > 100) {
            setHeaderVisible(prev => prev === !isScrollingDown ? prev : !isScrollingDown);
            setNavVisible(prev => prev === !isScrollingDown ? prev : !isScrollingDown);
            if (isScrollingDown) {
              setNavExpanded(prev => prev === false ? prev : false);
            }
          } else {
            setHeaderVisible(prev => prev === true ? prev : true);
            setNavVisible(prev => prev === true ? prev : true);
            setNavExpanded(prev => prev === true ? prev : true);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    headerVisible,
    setHeaderVisible,
    navVisible,
    setNavVisible,
    navExpanded,
    setNavExpanded,
  };
}
