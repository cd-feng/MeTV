'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';

interface NavItem {
  id: string;
  name: string;
}

export default function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const drawerContent = (
    <>
      {open && <div className="drawer-overlay" onClick={() => setOpen(false)} />}

      <div className={`drawer${open ? ' drawer-open' : ''}`} id="mobile-drawer" aria-hidden={!open}>
        <div className="drawer-header">
          <span className="navbar-brand" style={{ fontSize: '1.25rem' }}>MeTV</span>
          <button className="drawer-close" type="button" onClick={() => setOpen(false)} aria-label="Close menu">
            ×
          </button>
        </div>

        <nav className="drawer-nav">
          <Link href="/" className="drawer-link" onClick={() => setOpen(false)}>
            首页
          </Link>

          {items.map((item) => (
            <Link
              key={item.id}
              href={`/category/${item.id}`}
              className="drawer-link"
              onClick={() => setOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );

  return (
    <>
      <button
        className="hamburger-btn"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        aria-label="Open menu"
      >
        <span className={`hamburger-icon${open ? ' open' : ''}`} />
      </button>

      {typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null}
    </>
  );
}
