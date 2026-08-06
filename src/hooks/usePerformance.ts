import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePerformance() {
  const location = useLocation();

  const checkPerformanceSync = () => {
    if (typeof navigator === 'undefined') return { low: false, veryLow: false, isAndroid: false, isTrueAndroid: false };
    
    // Only apply Android optimizations on the home page
    const isHomePage = typeof window !== 'undefined' && window.location.pathname === '/';
    
    const nav = navigator as any;
    const memory = nav.deviceMemory || 8; 
    const cores = nav.hardwareConcurrency || 4;
    
    const ua = navigator.userAgent.toLowerCase();
    const isAndroidDevice = ua.indexOf("android") > -1;
    
    // If it's an Android device BUT we're not on the home page, pretend it's not Android
    // so it gets the full iPhone-like experience.
    const isAndroid = isAndroidDevice && isHomePage;
    
    let isSlowAndroid = false;
    if (isAndroid) {
      const match = ua.match(/android\s([0-9\.]+)/);
      const version = match ? parseFloat(match[1]) : 10;
      if (version < 10 || memory <= 4 || cores <= 4) {
        isSlowAndroid = true;
      }
    }

    return {
      low: isSlowAndroid,
      veryLow: isSlowAndroid,
      isAndroid,
      isTrueAndroid: isAndroidDevice
    };
  };

  const initial = checkPerformanceSync();
  const [isLowEnd, setIsLowEnd] = useState(initial.low);
  const [isVeryLowEnd, setIsVeryLowEnd] = useState(initial.veryLow);
  const [isAndroid, setIsAndroid] = useState(initial.isAndroid);
  const [isTrueAndroid, setIsTrueAndroid] = useState(initial.isTrueAndroid);

  useEffect(() => {
    const { low, veryLow, isAndroid, isTrueAndroid } = checkPerformanceSync();
    setIsLowEnd(low);
    setIsVeryLowEnd(veryLow);
    setIsAndroid(isAndroid);
    setIsTrueAndroid(isTrueAndroid);
  }, [location.pathname]);

  return { isLowEnd, isVeryLowEnd, isAndroid, isTrueAndroid };
}
