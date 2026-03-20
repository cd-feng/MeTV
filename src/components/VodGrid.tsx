'use client';

import Link from 'next/link';
import { VodItem } from '@/lib/api';

export default function VodGrid({ list }: { list: VodItem[] }) {
  return (
    <div className="grid-container">
      {list.map((item) => (
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
  );
}
