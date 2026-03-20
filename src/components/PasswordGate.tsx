'use client';

import { useState, useEffect, FormEvent } from 'react';

const STORAGE_KEY = 'metv_auth_passed';

export default function PasswordGate() {
  // null = 正在检测, true = 已通过/不需要, false = 需要输入密码
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // 先检查 localStorage 是否已认证
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      setAuthed(true);
      return;
    }

    // 向服务端询问是否需要密码
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (!data.required) {
        // 服务端未配置密码，免密访问
        setAuthed(true);
      } else {
        setAuthed(false);
      }
    } catch {
      // 网络错误时默认放行，避免阻断用户
      setAuthed(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem(STORAGE_KEY, '1');
        setAuthed(true);
      } else {
        setError(data.message || '密码错误，请重试');
        setPassword('');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 正在检测或已通过，不渲染任何内容
  if (authed !== false) return null;

  return (
    <div className="password-overlay">
      <div className="password-modal">
        <div className="password-icon">🔒</div>
        <h2 className="password-title">访问验证</h2>
        <p className="password-desc">本站为私有站点，请输入访问密码以继续</p>
        <form onSubmit={handleSubmit} className="password-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入访问密码"
            className="password-input"
            autoFocus
            autoComplete="off"
          />
          {error && <div className="password-error">{error}</div>}
          <button type="submit" className="password-btn" disabled={loading}>
            {loading ? '验证中...' : '确认进入'}
          </button>
        </form>
      </div>
    </div>
  );
}
