'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VodItem } from '@/lib/api';

export default function HeroCarousel({ items }: { items: VodItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const router = useRouter();
  const total = items.length;

  const go = useCallback((dir: 1 | -1) => {
    setActive((c) => (c + dir + total) % total);
  }, [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(() => go(1), 4500);
    return () => clearInterval(t);
  }, [paused, go, total]);

  if (!total) return null;

  const offset = (i: number) => {
    let d = i - active;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  };

  const VISIBLE = 2;

  return (
    <div
      className="hc-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="hc-bg"
        style={{ backgroundImage: `url(${items[active].vod_pic})` }}
      />
      <div className="hc-bg-overlay" />

      <div className="hc-stage">
        {items.map((item, i) => {
          const d = offset(i);
          if (Math.abs(d) > VISIBLE) return null;

          const isCenter = d === 0;
          const scale = isCenter ? 1.05 : Math.pow(0.75, Math.abs(d));
          const tx = d * 60;
          const rY = d * -20;
          const z = 100 - Math.abs(d) * 30;
          const opacity = isCenter ? 1 : 0.55 - Math.abs(d) * 0.1;
          const blur = isCenter ? 0 : Math.abs(d) * 3;

          const handleCardClick = () => {
            if (isCenter) {
              router.push(`/detail/${encodeURIComponent(item.vod_name || '')}`);
              return;
            }
            setActive(i);
          };

          return (
            <div
              key={item.vod_id || item.vod_name}
              className={`hc-card${isCenter ? ' hc-center' : ''}`}
              style={{
                transform: `translateX(${tx}%) scale(${scale}) rotateY(${rY}deg)`,
                zIndex: z,
                opacity,
                filter: `blur(${blur}px)`,
                cursor: 'pointer',
              }}
              onClick={handleCardClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={isCenter ? `播放 ${item.vod_name}` : `切换到 ${item.vod_name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.vod_pic || 'https://placehold.co/800x450/333/555?text=暂无封面'}
                alt={item.vod_name}
                className="hc-poster"
                draggable={false}
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x450/333/555?text=暂无封面'; }}
              />

              {isCenter && (
                <div className="hc-info">
                  <span className="hc-tag">{item.type_name}</span>
                  <h2 className="hc-title">{item.vod_name}</h2>
                  {item.vod_remarks && <span className="hc-remarks">{item.vod_remarks}</span>}
                  <p className="hc-blurb">
                    {(item.vod_blurb || '').replace(/<[^>]+>/g, '').slice(0, 80)}
                    {(item.vod_blurb || '').length > 80 ? '...' : ''}
                  </p>
                  <Link
                    href={`/detail/${encodeURIComponent(item.vod_name || '')}`}
                    className="hc-play-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    立即播放
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="hc-arrow hc-arrow-l" onClick={() => go(-1)} type="button" aria-label="上一张">
        ‹
      </button>
      <button className="hc-arrow hc-arrow-r" onClick={() => go(1)} type="button" aria-label="下一张">
        ›
      </button>

      <div className="hc-dots">
        {items.map((_, i) => (
          <button
            key={i}
            className={`hc-dot${i === active ? ' active' : ''}`}
            onClick={() => setActive(i)}
            type="button"
            aria-label={`切换到第 ${i + 1} 张`}
          />
        ))}
      </div>
    </div>
  );
}
