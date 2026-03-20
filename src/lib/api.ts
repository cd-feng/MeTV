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

const globalMappingCache = { time: 0, mapping: {} as Record<string, Record<string, number>> };
const MAPPING_TTL = 12 * 3600 * 1000; // 12小时

export async function getCategoryMapping() {
  const now = Date.now();
  if (now - globalMappingCache.time < MAPPING_TTL && Object.keys(globalMappingCache.mapping).length > 0) {
    return globalMappingCache.mapping;
  }

  const mapping: Record<string, Record<string, number>> = {};
  const promises = Object.entries(config).map(async ([key, conf]) => {
    try {
      const res = await fetch(`${conf.api}?ac=list`, { next: { revalidate: 43200 } });
      const data = await res.json();
      mapping[key] = {};
      (data.class || []).forEach((c: any) => {
        mapping[key][c.type_name] = c.type_id;
      });
    } catch {
      mapping[key] = {};
    }
  });

  await Promise.allSettled(promises);
  globalMappingCache.time = now;
  globalMappingCache.mapping = mapping;
  return mapping;
}

export async function fetchVodData(params: Record<string, string>) {
  // === 1. 尝试使用极速内存缓存 ===
  const cacheKey = 'VOD::' + JSON.stringify(params);
  const now = Date.now();
  const cached = globalAppCache.get(cacheKey);
  if (cached && (now - cached.time) < CACHE_TTL_MS) {
    return cached.data;
  }

  // === 2. 解析 catName 进行真实跨源 ID 映射 ===
  let catMapping: Record<string, Record<string, number>> | null = null;
  if (params.catName) {
    catMapping = await getCategoryMapping();
  }

  const isDynamic = !!params.wd || !!params.ids || !!params.h;
  const fetchOptions: RequestInit = isDynamic
    ? { cache: "no-store" }
    : { next: { revalidate: 3600 } };

  const promises = Object.entries(config).map(async ([sourceKey, sourceConfig]) => {
    // 拦截转换 catName: 查找该源专属的数字 ID
    let injectedTypeId: string | undefined;
    if (params.catName && catMapping) {
      const mappedId = catMapping[sourceKey]?.[params.catName];
      if (!mappedId) {
        // 白名单过滤：如果这个采集站压根儿没有“动作片”分类，那我们直接静默跳过它，不用再发多余的网络请求去添堵
        return { sourceKey, sourceName: sourceConfig.name, data: { list: [] } };
      }
      injectedTypeId = String(mappedId);
    }

    try {
      const targetUrl = new URL(sourceConfig.api);
      for (const [key, value] of Object.entries(params)) {
        if (key !== 'catName' && value) targetUrl.searchParams.set(key, value);
      }
      if (injectedTypeId) {
        targetUrl.searchParams.set('t', injectedTypeId);
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

// ---- 统一分类合并器 ----
let unifiedCatsCache: { time: number; data: CatItem[] } = { time: 0, data: [] };

export async function fetchCategories(): Promise<CatItem[]> {
  const now = Date.now();
  if (now - unifiedCatsCache.time < 3600 * 1000 * 12 && unifiedCatsCache.data.length > 0) {
    return unifiedCatsCache.data;
  }

  const promises = Object.entries(config).map(async ([key, conf]) => {
    try {
      const res = await fetch(`${conf.api}?ac=list`, { next: { revalidate: 43200 } });
      const data = await res.json();
      return { key, classes: (data.class || []) as CatItem[] };
    } catch {
      return null;
    }
  });

  const results = await Promise.allSettled(promises);
  const validResults = results
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter((r): r is { key: string; classes: CatItem[] } => r !== null && r.classes.length > 0);

  const baseResult = validResults.find(r => r.key === 'dyttzy') || validResults[0];
  if (!baseResult) return [];

  // 以核心站为基准框架
  const unified: CatItem[] = [...baseResult.classes];
  let nextFakeId = 10000;

  for (const res of validResults) {
    if (res.key === baseResult.key) continue;

    for (const cat of res.classes) {
      // 通过全名称完全一致判重
      if (unified.some(u => u.type_name === cat.type_name)) continue;

      if (cat.type_pid !== 0) {
        // 查找这个子分类在原本站点的父分类名
        const parentName = res.classes.find(c => c.type_id === cat.type_pid)?.type_name || '';

        // 智能分类归属算法（解决烂站没有标准的父分类）
        let keyword = '';
        if (parentName.includes('电影') || cat.type_name.includes('片') || cat.type_name.includes('电影')) keyword = '电影';
        else if (parentName.includes('剧') || parentName.includes('连续')) keyword = '剧';
        else if (parentName.includes('动漫') || parentName.includes('动画')) keyword = '动漫';
        else if (parentName.includes('综艺')) keyword = '综艺';

        if (keyword) {
          // 找到我们基准框架里的那个“根节点”
          const unifiedParent = unified.find(u => u.type_pid === 0 && (u.type_name.includes(keyword) || u.type_name.includes(keyword[0])));
          if (unifiedParent) {
            unified.push({
              type_id: nextFakeId++,
              type_pid: unifiedParent.type_id,
              type_name: cat.type_name
            });
          }
        }
      }
    }
  }

  unifiedCatsCache = { time: now, data: unified };
  return unified;
}
