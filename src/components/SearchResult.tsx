'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import VodGrid from './VodGrid';
import { VodItem } from '@/lib/api';
import HorizontalScroll from './HorizontalScroll';

export default function SearchResult({ wd, pg, list }: { wd: string; pg: string; list: VodItem[] }) {
  const [sourceFilter, setSourceFilter] = useState<string>('');

  const availableSources = useMemo(() => {
    const sourceMap = new Map<string, string>();
    list.forEach(item => {
      (item.sources || []).forEach(src => {
        sourceMap.set(src.sourceKey, src.sourceName);
      });
    });
    return Array.from(sourceMap.entries()).map(([key, name]) => ({ key, name }));
  }, [list]);

  const filteredList = useMemo(() => {
    if (!sourceFilter) return list;
    return list.filter(item =>
      (item.sources || []).some(src => src.sourceKey === sourceFilter)
    );
  }, [list, sourceFilter]);

  return (
    <div className="page-content">
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h1 className="section-title">搜索：{wd}</h1>
      </div>

      {availableSources.length > 0 && (
        <HorizontalScroll className="source-tabs-scroll" style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setSourceFilter('')}
            className={`seg-btn${!sourceFilter ? ' active' : ''}`}
            style={{ cursor: 'pointer', outline: 'none', border: 'none' }}
          >
            全部站点
          </button>
          {availableSources.map(src => (
            <button
              key={src.key}
              onClick={() => setSourceFilter(src.key)}
              className={`seg-btn${sourceFilter === src.key ? ' active' : ''}`}
              style={{ cursor: 'pointer', outline: 'none', border: 'none' }}
            >
              {src.name}
            </button>
          ))}
        </HorizontalScroll>
      )}

      {filteredList.length === 0
        ? <div className="empty-state"><span>🎬</span><p>未找到相关影视资源</p></div>
        : <VodGrid list={filteredList} />
      }
      <div className="pagination">
        {parseInt(pg) > 1 && (
          <Link href={`/?wd=${wd}&pg=${parseInt(pg) - 1}`}>
            <button className="page-btn">« 上一页</button>
          </Link>
        )}
        <button className="page-btn active">第 {pg} 页</button>
        <Link href={`/?wd=${wd}&pg=${parseInt(pg) + 1}`}>
          <button className="page-btn">下一页 »</button>
        </Link>
      </div>
    </div>
  );
}
