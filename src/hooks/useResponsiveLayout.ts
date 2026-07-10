import { useEffect, useState } from 'react';

export type ResponsiveLayoutMode = 'mobile' | 'tablet' | 'desktop';

const getLayoutMode = (width: number): ResponsiveLayoutMode => {
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
};

export const useResponsiveLayout = () => {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  );

  useEffect(() => {
    const updateWidth = () => {
      setWidth(window.innerWidth);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    window.addEventListener('orientationchange', updateWidth);

    return () => {
      window.removeEventListener('resize', updateWidth);
      window.removeEventListener('orientationchange', updateWidth);
    };
  }, []);

  const layoutMode = getLayoutMode(width);

  return {
    width,
    layoutMode,
    isMobile: layoutMode === 'mobile',
    isTablet: layoutMode === 'tablet',
    isDesktop: layoutMode === 'desktop',
  };
};
