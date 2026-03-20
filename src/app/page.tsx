import { fetchVodData, fetchCategories, VodItem } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';
import HeroCarousel from '@/components/HeroCarousel';
import CategorySection from '@/components/CategorySection';
import VodGrid from '@/components/VodGrid';
import SearchResult from '@/components/SearchResult';
import Link from 'next/link';

export const runtime = 'edge';
export const revalidate = 3600;

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;
  const wd = params.wd;
  const pg = params.pg || '1';

  // ---- 搜索结果页 ----
  if (wd) {
    let list: VodItem[] = [];
    try {
      const data = await fetchVodData({ ac: 'detail', wd, pg });
      list = data.list || [];
    } catch { /* ignore */ }

    return <SearchResult wd={wd} pg={pg} list={list} />;
  }

  // ---- 首页并发拉取数据 ----
  const rawCats = await fetchCategories();
  const tree = buildCategoryTree(rawCats);

  // 找到电影/剧集/动漫的一级 ID
  const movieCat   = tree.find(c => c.name.includes('电影'));
  const dramasCat  = tree.find(c => c.name.includes('剧') || c.name.includes('连续'));
  const animeCat   = tree.find(c => c.name.includes('动漫') || c.name.includes('动画'));

  // 找每类的第一个子分类 ID（如 动作片、国产剧、国产动漫）
  const firstSubId = (cat: typeof movieCat) => cat?.sub[0]?.id;

  const [latestData, movieData, dramaData, animeData] = await Promise.allSettled([
    fetchVodData({ ac: 'detail', h: '24', pg: '1' }),  // 最近更新（轮播数据源）
    fetchVodData({ ac: 'detail', t: firstSubId(movieCat) || '6',   pg: '1' }),
    fetchVodData({ ac: 'detail', t: firstSubId(dramasCat) || '13', pg: '1' }),
    fetchVodData({ ac: 'detail', t: firstSubId(animeCat) || '29',  pg: '1' }),
  ]);

  const latest: VodItem[] = latestData.status === 'fulfilled' ? latestData.value.list || [] : [];
  const movies: VodItem[] = movieData.status  === 'fulfilled' ? movieData.value.list  || [] : [];
  const dramas: VodItem[] = dramaData.status  === 'fulfilled' ? dramaData.value.list  || [] : [];
  const anime:  VodItem[] = animeData.status  === 'fulfilled' ? animeData.value.list  || [] : [];

  // 轮播：取前 8 条有封面的资源
  const carouselItems = latest.filter(v => v.vod_pic).slice(0, 8);
  // 最近更新板块：取前 2 行（约 12 张）
  const recentItems = latest.slice(0, 12);

  return (
    <>
      {/* 1. 英雄轮播 */}
      {carouselItems.length > 0 && <HeroCarousel items={carouselItems} />}

      <div className="page-content">
        {/* 2. 最近更新（2行） */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-header">
            <h2 className="section-title">最近更新</h2>
            <Link href="/" className="section-more">刷新 »</Link>
          </div>
          <VodGrid list={recentItems} />
        </section>

        {/* 3. 电影板块 */}
        {movieCat && (
          <CategorySection
            title={movieCat.name}
            catId={firstSubId(movieCat) || '6'}
            initialLatest={movies}
            maxItems={12}
          />
        )}

        {/* 4. 剧集板块 */}
        {dramasCat && (
          <CategorySection
            title={dramasCat.name}
            catId={firstSubId(dramasCat) || '13'}
            initialLatest={dramas}
            maxItems={12}
          />
        )}

        {/* 5. 动漫板块 */}
        {animeCat && (
          <CategorySection
            title={animeCat.name}
            catId={firstSubId(animeCat) || '29'}
            initialLatest={anime}
            maxItems={12}
          />
        )}
      </div>
    </>
  );
}
