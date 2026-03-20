'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'metv_disclaimer_accepted';

export default function DisclaimerModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 仅首次访问时弹出（localStorage 中无确认记录）
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="disclaimer-overlay">
      <div className="disclaimer-modal">
        <div className="disclaimer-icon">⚠️</div>
        <h2 className="disclaimer-title">免责声明</h2>
        <div className="disclaimer-body">
          <p>
            本站所有影视资源均来源于第三方资源站（电影天堂），本站不存储、不制作任何视频内容。
          </p>
          <p>
            所有内容仅供学习与交流使用，请在观看后 24 小时内删除。如有侵权，请联系我们删除相关内容。
          </p>
          <p>
            继续使用本站即表示您已知晓并同意以上内容。
          </p>
        </div>
        <button className="disclaimer-btn" onClick={handleAccept}>
          我已知晓，进入网站
        </button>
      </div>
    </div>
  );
}
