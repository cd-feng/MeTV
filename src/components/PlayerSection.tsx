'use client';

import React, { useState } from 'react';
import HlsPlayer from './HlsPlayer';

interface Episode {
  title: string;
  url: string;
}

export default function PlayerSection({ episodes }: { episodes: Episode[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (episodes.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <span>📺</span><p>暂无可用播放源</p>
      </div>
    );
  }

  const current = episodes[currentIndex];

  return (
    <div style={{ width: '100%' }}>
      <HlsPlayer src={current.url} />
      {episodes.length > 1 && (
        <div style={{ marginTop: '2rem' }}>
          <div className="section-header">
            <h3 className="section-title" style={{ fontSize: '1rem' }}>选集</h3>
          </div>
          <div className="episode-grid">
            {episodes.map((ep, idx) => (
              <button
                key={idx}
                className={`ep-btn${currentIndex === idx ? ' active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                {ep.title || `第 ${idx + 1} 集`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
