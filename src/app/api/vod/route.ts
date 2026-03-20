import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const API_BASE_URL = "http://caiji.dyttzyapi.com/api.php/provide/vod/";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ac = searchParams.get("ac") || "list"; // 默认 list，或者 detail
  const pg = searchParams.get("pg") || "1";
  const t = searchParams.get("t");
  const wd = searchParams.get("wd");
  const h = searchParams.get("h");
  const ids = searchParams.get("ids"); // 详情接口必填参数

  const targetUrl = new URL(API_BASE_URL);
  targetUrl.searchParams.set("ac", ac);
  targetUrl.searchParams.set("pg", pg);
  if (t) targetUrl.searchParams.set("t", t);
  if (wd) targetUrl.searchParams.set("wd", wd);
  if (h) targetUrl.searchParams.set("h", h);
  if (ids) targetUrl.searchParams.set("ids", ids);

  try {
    // 搜索、最近更新和具体 ID 查询不缓存，常规列表分类则启用1小时缓存提升性能
    const isDynamic = !!wd || !!ids || !!h;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchOptions: any = isDynamic ? { cache: 'no-store' } : { next: { revalidate: 3600 } };
    
    const res = await fetch(targetUrl.toString(), fetchOptions);

    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Proxy Error:", error);
    return NextResponse.json(
      { code: 500, msg: "Failed to fetch remote data", error: error.message },
      { status: 500 }
    );
  }
}
