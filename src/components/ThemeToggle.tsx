'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const next: Record<string, { next: 'light' | 'dark' | 'system'; icon: string; label: string }> = {
    system: { next: 'dark', icon: '🌙', label: '' },
    dark: { next: 'light', icon: '☀️', label: '' },
    light: { next: 'system', icon: '🖥️', label: '' },
  };

  const current = next[theme] || next.system;

  return (
    <button
      onClick={() => setTheme(current.next)}
      title={`切换为${current.label}模式`}
      style={{
        display: 'flex',
        alignItems: 'center',
        // gap: '0.35rem',
        padding: '0.25rem',
        borderRadius: '20px',
        border: '1.5px solid var(--border)',
        background: 'var(--sub-bg)',
        color: 'var(--fg)',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 500,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {current.icon}
      <span className="theme-label">{current.label}</span>
    </button>
  );
}
