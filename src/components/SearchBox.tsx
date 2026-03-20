'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState, useRef, useEffect } from 'react';

export default function SearchBox() {
  const [keyword, setKeyword] = useState('');
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/?wd=${encodeURIComponent(keyword.trim())}`);
      setExpanded(false);
    } else {
      router.push(`/`);
    }
  };

  // 展开时自动聚焦输入框
  useEffect(() => {
    if (expanded && inputRef.current) {
      // 延迟聚焦，确保动画完成后弹出键盘
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [expanded]);

  // ESC 关闭
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <>
      {/* PC 端：常规内联搜索框 */}
      <form onSubmit={handleSearch} className="search-form search-desktop">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索电影、剧集、动漫..."
          className="search-input"
        />
        <button type="submit" className="search-btn">
          🔍
        </button>
      </form>

      {/* 移动端：搜索图标按钮 */}
      <button
        type="button"
        className="search-mobile-trigger"
        onClick={() => setExpanded(true)}
        aria-label="搜索"
      >
        🔍
      </button>

      {/* 移动端：全屏搜索覆盖层 */}
      {expanded && (
        <div className="search-overlay">
          <form onSubmit={handleSearch} className="search-overlay-form">
            <button
              type="button"
              className="search-overlay-back"
              onClick={() => setExpanded(false)}
              aria-label="返回"
            >
              ←
            </button>
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索电影、剧集、动漫..."
              className="search-overlay-input"
              autoComplete="off"
            />
            <button type="submit" className="search-overlay-submit">
              搜索
            </button>
          </form>
        </div>
      )}
    </>
  );
}
