import { fetchVodData, VodItem } from '@/lib/api';
import PlayerSection from '@/components/PlayerSection';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await fetchVodData({ ac: 'detail', ids: id });
    const item = data.list?.[0];
    if (item) return { title: `${item.vod_name} - MeTV`, description: item.vod_blurb || item.vod_name };
  } catch { /* ignore */ }
  return { title: '影视详情 - MeTV' };
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let item: VodItem | null = null;

  try {
    const data = await fetchVodData({ ac: 'detail', ids: id });
    if (data.list?.length > 0) item = data.list[0];
  } catch {
    // fall through to 404 below
  }

  if (!item) return notFound();

  const parsePlayUrls = (playUrlStr: string) => {
    if (!playUrlStr) return [];
    const groups = playUrlStr.split('$$$');
    let targetIdx = groups.findIndex(g => g.toLowerCase().includes('.m3u8'));
    if (targetIdx === -1) targetIdx = 0;
    const target = groups[targetIdx];
    if (!target) return [];
    return target.split('#').map(ep => {
      const parts = ep.split('$');
      return { title: parts[0] || '播放', url: parts[1] || '' };
    }).filter(ep => ep.url);
  };

  const episodes = parsePlayUrls(item.vod_play_url);

  return (
    <div className="page-content">
      {/* 影片基本信息 */}
      <div className="detail-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.vod_pic || 'https://placehold.co/220x330/333/555?text=暂无封面'}
          alt={item.vod_name}
          className="detail-poster"
        />
        <div className="detail-info">
          <h1 className="detail-title">{item.vod_name}</h1>
          <div className="detail-meta-row">
            <span className="detail-meta-item"><strong>类型：</strong>{item.type_name}</span>
            <span className="detail-meta-item"><strong>状态：</strong>{item.vod_remarks}</span>
            <span className="detail-meta-item"><strong>更新：</strong>{item.vod_time}</span>
          </div>
          <div className="detail-blurb"
            dangerouslySetInnerHTML={{ __html: item.vod_blurb || '<em>暂无简介</em>' }}
          />
        </div>
      </div>

      {/* 播放区 */}
      <div className="section-header">
        <h2 className="section-title">在线播放</h2>
      </div>
      <PlayerSection episodes={episodes} />
    </div>
  );
}
