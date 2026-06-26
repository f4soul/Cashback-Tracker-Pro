import { useState, useEffect } from 'react';

export function useScrollVisibility() {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const [navExpanded, setNavExpanded] = useState(true);

  // Handle header and nav visibility on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;

      if (currentScrollY > 100) {
        setHeaderVisible(!isScrollingDown);
        setNavVisible(!isScrollingDown);
        if (isScrollingDown) {
          setNavExpanded(false);
        }
      } else {
        setHeaderVisible(true);
        setNavVisible(true);
        setNavExpanded(true);
      }
      lastScrollY = currentScrollY;
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
