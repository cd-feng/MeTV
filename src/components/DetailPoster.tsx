'use client';

export default function DetailPoster({ src, alt, className }: { src: string, alt: string, className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => { e.currentTarget.src = 'https://placehold.co/220x330/333/555?text=暂无封面'; }}
    />
  );
}
