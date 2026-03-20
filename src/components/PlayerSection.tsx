'use client';

import React, { useState, useEffect } from 'react';
import HlsPlayer from './HlsPlayer';

interface Episode {
  title: string;
  url: string;
}

interface SourceData {
  sourceName: string;
  sourceKey: string;
  episodes: Episode[];
}

export default function PlayerSection({ sources }: { sources: SourceData[] }) {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);

  useEffect(() => {
    // 防止切换源时集数越界
    if (sources[currentSourceIndex] && sources[currentSourceIndex].episodes.length <= currentEpisodeIndex) {
      setCurrentEpisodeIndex(0);
    }
  }, [currentSourceIndex, currentEpisodeIndex, sources]);

  if (!sources || sources.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <span>📺</span><p>暂无可用播放源</p>
      </div>
    );
  }

  const currentSource = sources[currentSourceIndex];
  const currentEpisode = currentSource?.episodes[currentEpisodeIndex] || currentSource?.episodes[0];

  return (
    <div style={{ width: '100%' }}>
      {currentEpisode && currentEpisode.url ? (
        <HlsPlayer src={currentEpisode.url} />
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#000', color: '#fff' }}>
          播放链接无效
        </div>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* 多源切换区 */}
        {sources.length > 1 && (
          <div>
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <h3 className="section-title" style={{ fontSize: '1.1rem' }}>播放源</h3>
            </div>
            <div className="source-tabs-scroll">
              {sources.map((src, idx) => (
                <button
                  key={src.sourceKey}
                  className={`ep-btn${currentSourceIndex === idx ? ' active' : ''}`}
                  onClick={() => setCurrentSourceIndex(idx)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    width: 'auto',
                    minWidth: 'auto',
                    border: currentSourceIndex === idx ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {src.sourceName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 选集区 */}
        {currentSource?.episodes.length > 0 && (
          <div>
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <h3 className="section-title" style={{ fontSize: '1.1rem' }}>选集</h3>
            </div>
            <div className="episode-grid">
              {currentSource.episodes.map((ep, idx) => (
                <button
                  key={idx}
                  className={`ep-btn${currentEpisodeIndex === idx ? ' active' : ''}`}
                  onClick={() => setCurrentEpisodeIndex(idx)}
                >
                  {ep.title || `第 ${idx + 1} 集`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
