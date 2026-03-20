export const API_BASE_URL = "http://caiji.dyttzyapi.com/api.php/provide/vod/";

export interface VodItem {
  vod_id: number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_time: string;
  vod_play_from: string;
  vod_play_url: string;
  type_name: string;
  vod_blurb?: string;
}

/** 从 API 返回的分类项 */
export interface CatItem {
  type_id: number;
  type_pid: number;
  type_name: string;
}

export async function fetchVodData(params: Record<string, string>) {
  const targetUrl = new URL(API_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value) targetUrl.searchParams.set(key, value);
  }

  const isDynamic = !!params.wd || !!params.ids || !!params.h;
  const fetchOptions: RequestInit = isDynamic
    ? { cache: "no-store" }
    : { next: { revalidate: 3600 } };

  const res = await fetch(targetUrl.toString(), fetchOptions);
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
  return res.json();
}

/** 获取全部分类列表，数据缓存12小时 */
export async function fetchCategories(): Promise<CatItem[]> {
  const url = `${API_BASE_URL}?ac=list`;
  try {
    const res = await fetch(url, { next: { revalidate: 43200 } }); // 12h 缓存
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.class || [];
  } catch (e) {
    console.error("Failed to fetch categories:", e);
    return [];
  }
}
