'use client';
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls;
    if (Hls.isSupported()) {
      hls = new Hls({
        capLevelToPlayerSize: true, // 提升性能
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
         // Auto play is normally blocked, letting user click play is safer
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari 支持原生 HLS
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <div style={{ width: '100%', background: '#000', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/9' }}>
      <video
        ref={videoRef}
        controls
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
      />
    </div>
  );
}
