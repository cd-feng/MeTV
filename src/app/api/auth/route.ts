import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * 密码验证 API
 * POST /api/auth
 * Body: { password: string }
 *
 * 环境变量 ACCESS_PASSWORD 未设置时，视为不需要密码，直接返回成功。
 */
export async function POST(request: Request) {
  const accessPassword = process.env.ACCESS_PASSWORD;

  // 未配置密码 → 免密访问
  if (!accessPassword) {
    return NextResponse.json({ ok: true, skipAuth: true });
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (password === accessPassword) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, message: '密码错误' }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, message: '请求格式错误' }, { status: 400 });
  }
}

/**
 * GET /api/auth
 * 检查是否需要密码（不暴露密码本身）
 */
export async function GET() {
  const accessPassword = process.env.ACCESS_PASSWORD;
  return NextResponse.json({ required: !!accessPassword });
}
