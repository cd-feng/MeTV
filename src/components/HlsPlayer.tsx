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
        capLevelToPlayerSize: true,    // 限制分辨率到播放器尺寸
        enableWorker: true,            // 开启 Web Worker 多线程处理
        lowLatencyMode: true,          // 开启低延迟模式
        startLevel: 0,                 // 强制从最低质量起播，画面先出，再自动升质量(ABR)
        abrEwmaDefaultEstimate: 500000, // 初始带宽预估调低(500Kbps)，避免首次尝试高分辨率切片失败
        maxBufferLength: 10,           // 降低最大缓冲需求(秒)，加快起播
        maxMaxBufferLength: 30,        // 绝对最大缓冲长度(秒)
        manifestLoadingTimeOut: 20000, // 延长 M3U8 解析超时
        fragLoadingTimeOut: 20000,     // 延长 TS 切片下载超时
        fragLoadingMaxRetry: 4,        // 增加切片下载失败重试次数
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
