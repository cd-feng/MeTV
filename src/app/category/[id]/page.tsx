import Link from 'next/link';
import { fetchVodData, fetchCategories, VodItem } from '@/lib/api';
import { buildCategoryTree, findCatById, getCategoryTitle } from '@/lib/categories';
import VodGrid from '@/components/VodGrid';
import { notFound } from 'next/navigation';

export const runtime = 'edge';
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cats = await fetchCategories();
  const name = getCategoryTitle(cats, id);
  return { title: `${name} - MeTV`, description: `${name} 在线观看，高清视频资源` };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pg?: string }>;
}) {
  const { id } = await params;
  const { pg = '1' } = await searchParams;

  // 动态获取全部分类
  const rawCats = await fetchCategories();
  const found = findCatById(rawCats, id);
  if (!found) return notFound();

  const { item, parent } = found;
  const tree = buildCategoryTree(rawCats);

  // 判断是一级（parent）还是二级（sub）分类
  const isSub = parent !== null && parent !== undefined;
  const mainCat = isSub
    ? tree.find(c => c.id === String(parent!.type_id))
    : tree.find(c => c.id === id);
  const subCategories = mainCat?.sub ?? [];

  // 实际请求的分类 ID：一级分类则自动用第一个子类，二级直接用自身
  const activeSubId = isSub ? id : (subCategories[0]?.id ?? id);

  let list: VodItem[] = [];
  let totalPage = 1;
  let errorMsg = '';

  try {
    const data = await fetchVodData({ ac: 'detail', t: activeSubId, pg });
    list = data.list || [];
    totalPage = data.pagecount || 1;
  } catch {
    errorMsg = '数据加载失败，请稍后重试。';
  }

  const pageTitle = isSub
    ? `${parent!.type_name} · ${item.type_name}`
    : item.type_name;

  return (
    <>
      {/* 子分类 Tabs */}
      {subCategories.length > 0 && (
        <div className="category-tabs">
          {subCategories.map((s) => (
            <Link key={s.id} href={`/category/${s.id}`}>
              <span className={`cat-tab${activeSubId === s.id ? ' active' : ''}`}>
                {s.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="page-content">
        <div className="section-header" style={{ marginBottom: '1.5rem' }}>
          <h1 className="section-title">{pageTitle}</h1>
        </div>

        {errorMsg ? (
          <div className="empty-state"><span>⚠️</span><p>{errorMsg}</p></div>
        ) : list.length === 0 ? (
          <div className="empty-state"><span>🎬</span><p>暂无数据</p></div>
        ) : (
          <>
            <VodGrid list={list} />
            <div className="pagination">
              {parseInt(pg) > 1 && (
                <Link href={`/category/${activeSubId}?pg=${parseInt(pg) - 1}`}>
                  <button className="page-btn">« 上一页</button>
                </Link>
              )}
              <button className="page-btn active">第 {pg} / {totalPage} 页</button>
              {parseInt(pg) < totalPage && (
                <Link href={`/category/${activeSubId}?pg=${parseInt(pg) + 1}`}>
                  <button className="page-btn">下一页 »</button>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
