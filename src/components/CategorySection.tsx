'use client';

import { useState } from 'react';
import Link from 'next/link';
import VodGrid from './VodGrid';
import { VodItem } from '@/lib/api';

interface Props {
  title: string;
  catId: string;
  initialLatest: VodItem[];
  maxItems?: number;
}

export default function CategorySection({ title, catId, initialLatest, maxItems = 6 }: Props) {
  const [mode, setMode] = useState<'latest' | 'hot'>('latest');
  const [hotList, setHotList] = useState<VodItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (m: 'latest' | 'hot') => {
    if (m === mode) return;
    setMode(m);
    if (m === 'hot' && !hotList) {
      setLoading(true);
      try {
        const res = await fetch(`/api/vod?ac=detail&t=${catId}&pg=1`);
        const data = await res.json();
        setHotList(data.list || []);
      } catch {
        setHotList([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const current = mode === 'latest' ? initialLatest : (hotList || initialLatest);
  const displayed = current.slice(0, maxItems);

  return (
    <section style={{ marginBottom: '3rem' }}>
      {/* 板块标题行 */}
      <div className="section-header" style={{ marginBottom: '1.2rem' }}>
        <h2 className="section-title">{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="seg-btn-group">
            <button
              className={`seg-btn${mode === 'latest' ? ' active' : ''}`}
              onClick={() => handleToggle('latest')}
            >最新</button>
            <button
              className={`seg-btn${mode === 'hot' ? ' active' : ''}`}
              onClick={() => handleToggle('hot')}
            >最热</button>
          </div>
          <Link href={`/category/${catId}`} className="section-more">
            查看全部 »
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
          加载中…
        </div>
      ) : (
        /* shelf-row：6列固定宽度行 */
        <div className="shelf-row">
          {displayed.map(item => (
            <Link href={`/detail/${encodeURIComponent(item.vod_name || '')}`} key={item.vod_id || item.vod_name} className="vod-card">
              <div className="vod-poster-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.vod_pic || 'https://placehold.co/300x450/333/555?text=暂无封面'}
                  alt={item.vod_name}
                  className="vod-poster"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x450/333/555?text=暂无封面'; }}
                />
                {item.vod_remarks && (
                  <span className={`vod-badge${item.vod_remarks.includes('全') ? '' : ' hot'}`}>
                    {item.vod_remarks}
                  </span>
                )}
              </div>
              <div className="vod-info">
                <div className="vod-title" title={item.vod_name}>{item.vod_name}</div>
                <div className="vod-meta">
                  <span>{item.type_name}</span>
                  <span>{item.vod_time?.split(' ')[0]}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
