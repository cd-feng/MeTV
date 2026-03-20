import configData from './config.json';

type ConfigMap = Record<string, { api: string; name: string; detail: string }>;
const config = configData as ConfigMap;

export interface VodSource {
  sourceKey: string;
  sourceName: string;
  vod_id: number;
  vod_play_from: string;
  vod_play_url: string;
}

export interface VodItem {
  vod_id?: number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_time: string;
  vod_play_from?: string;
  vod_play_url?: string;
  type_name: string;
  vod_blurb?: string;
  sources?: VodSource[];
}

export interface CatItem {
  type_id: number;
  type_pid: number;
  type_name: string;
}

// ---- 全局内存缓存加速器 ----
const globalAppCache = new Map<string, { time: number; data: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟有效

export async function fetchVodData(params: Record<string, string>) {
  // === 1. 尝试使用极速内存缓存 ===
  const cacheKey = 'VOD::' + JSON.stringify(params);
  const now = Date.now();
  const cached = globalAppCache.get(cacheKey);
  if (cached && (now - cached.time) < CACHE_TTL_MS) {
    return cached.data;
  }

  const isDynamic = !!params.wd || !!params.ids || !!params.h;
  const fetchOptions: RequestInit = isDynamic
    ? { cache: "no-store" }
    : { next: { revalidate: 3600 } };

  const promises = Object.entries(config).map(async ([sourceKey, sourceConfig]) => {
    try {
      const targetUrl = new URL(sourceConfig.api);
      for (const [key, value] of Object.entries(params)) {
        if (value) targetUrl.searchParams.set(key, value);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(targetUrl.toString(), {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const textRaw = await res.text();
      let data;
      try {
        data = JSON.parse(textRaw);
      } catch (e) {
        // 如果响应的不是合法 JSON（如：暂不支持搜索），直接忽略，不在终端大篇幅报警
        return { sourceKey, sourceName: sourceConfig.name, data: { list: [] } };
      }

      return { sourceKey, sourceName: sourceConfig.name, data };
    } catch (err: any) {
      // 捕获网络超时或无法连接的情况，并简化为一条短日志
      console.warn(`[API] 采集站 ${sourceConfig.name} (${sourceKey}) 请求失败: ${err.message || '未知网络错误'}`);
      return { sourceKey, sourceName: sourceConfig.name, data: { list: [] } };
    }
  });

  const results = await Promise.allSettled(promises);
  const itemsMap = new Map<string, VodItem>();
  let maxPageCount = 1;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { sourceKey, sourceName, data } = result.value;
      if (data && data.pagecount) {
        maxPageCount = Math.max(maxPageCount, Number(data.pagecount) || 1);
      }
      if (data && Array.isArray(data.list)) {
        for (const item of data.list) {
          const name = item.vod_name?.trim();
          if (!name) continue;

          if (!itemsMap.has(name)) {
            itemsMap.set(name, {
              ...item,
              sources: []
            });
          }
          const existing = itemsMap.get(name)!;
          // 合并时，我们始终保留更新时间靠后的主图和状态
          if (item.vod_time > existing.vod_time) {
            existing.vod_time = item.vod_time;
            existing.vod_remarks = item.vod_remarks;
            if (item.vod_pic && item.vod_pic.startsWith("http")) existing.vod_pic = item.vod_pic;
            if (item.vod_blurb) existing.vod_blurb = item.vod_blurb;
          }

          existing.sources!.push({
            sourceKey,
            sourceName,
            vod_id: item.vod_id,
            vod_play_from: item.vod_play_from,
            vod_play_url: item.vod_play_url
          });
        }
      }
    }
  }

  // 按时间降序排序
  const mergedList = Array.from(itemsMap.values()).sort((a, b) => {
    return new Date(b.vod_time).getTime() - new Date(a.vod_time).getTime();
  });

  const finalResult = { list: mergedList, pagecount: maxPageCount };
  
  // 写入缓存
  globalAppCache.set(cacheKey, { time: Date.now(), data: finalResult });
  
  return finalResult;
}

/** 获取全部分类列表，数据缓存12小时 */
export async function fetchCategories(): Promise<CatItem[]> {
  const mainApi = config["dyttzy"].api;
  const url = `${mainApi}?ac=list`;
  try {
    const res = await fetch(url, { next: { revalidate: 43200 } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.class || [];
  } catch (e) {
    console.error("Failed to fetch categories:", e);
    return [];
  }
}
