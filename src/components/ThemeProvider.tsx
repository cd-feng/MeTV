'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  // Mount 时读取系统/localStorage 偏好
  useEffect(() => {
    const saved = localStorage.getItem('metv-theme') as Theme | null;
    const initial = saved || 'system';
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const handleSet = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('metv-theme', t);
    applyTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSet }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (t === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme'); // 跟随系统
  }
}

export function useTheme() {
  return useContext(ThemeContext);
}
