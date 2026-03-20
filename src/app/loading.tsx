export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        gap: '1.5rem',
      }}
    >
      {/* 品牌 Logo */}
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          letterSpacing: '-1px',
          background: 'linear-gradient(135deg, #ff6b35, #ff9a3c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        MeTV
      </div>

      {/* 旋转加载环 */}
      <div
        style={{
          width: 48,
          height: 48,
          border: '4px solid rgba(255,107,53,0.2)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <p style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>正在加载精彩内容…</p>
    </div>
  );
}
