import { useEffect } from 'react';
import { useUIStore } from '@/store/ui';

export function useThemeEffect() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--resume-primary', theme.color);
    root.style.setProperty('--resume-tag', theme.tagColor);
  }, [theme.color, theme.tagColor]);
}
