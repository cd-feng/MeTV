'use client';

import React, { useRef, useEffect, ReactNode } from 'react';

interface HorizontalScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export default function HorizontalScroll({
  children,
  className,
  ...props
}: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // 如果主要是横向滚动（触控板），保持原生行为
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }
      
      // 如果内容出现了横向滚动条，把竖向滚轮转换为横向滚动
      if (el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      isDragging = false;
      el.style.cursor = 'grabbing';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = '';
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = '';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      // 敏感度可调
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        isDragging = true;
      }
      el.scrollLeft = scrollLeft - walk;
    };

    const onClick = (e: MouseEvent) => {
      // 捕获阶段拦截：如果是拖拽才结束触发的click，则阻止
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('click', onClick, { capture: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('click', onClick, { capture: true });
    };
  }, []);

  return (
    <div ref={scrollRef} className={className} {...props}>
      {children}
    </div>
  );
}
