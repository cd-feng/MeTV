# MeTV 技术文档

## 1. 项目概述

MeTV 是一个基于 Next.js 的在线影视浏览与播放 Web 应用。项目主要通过对接第三方采集接口（如 `caiji.dyttzyapi.com`）获取影视数据，提供分类浏览、搜索、详情展示以及基于 HLS (M3U8) 协议的视频在线播放功能。

## 2. 核心技术栈

- **框架**: Next.js 16 (采用 App Router 架构)
- **前端库**: React 19
- **语言**: TypeScript (严格模式)
- **播放器**: `hls.js` (实现 M3U8 格式视频流播放)
- **功能特性**: 支持亮色/暗色/跟随系统主题切换，适配移动端。
- **代码规范**: ESLint

## 3. 目录与模块结构

```text
MeTV/
├── src/
│   ├── app/                    # 路由目录 (App Router)
│   │   ├── api/                
│   │   │   ├── auth/route.ts   # 访问鉴权 API，基于环境变量 ACCESS_PASSWORD
│   │   │   └── vod/route.ts    # 影视数据代理 API，解决前端跨域与请求拦截
│   │   ├── category/[id]/      # 动态路由 - 特定分类列表页
│   │   └── detail/[id]/        # 动态路由 - 视频详情与播放页
│   ├── components/             # 公共 React 组件 (UI 面板等)
│   └── lib/                    # 核心工具类与配置 (API 请求等)
├── public/                     # 静态资源文件 (图标、图片等)
├── Dockerfile                  # Docker 容器化构建配置 (基于 Next.js standalone)
├── install.sh                  # Linux 系统级一键部署脚本 (SystemD 管理)
├── uninstall.sh                # Linux 系统级卸载脚本
├── package.json                # 项目依赖管理
└── tsconfig.json               # TypeScript 编译配置
```

## 4. 关键功能实现解析

### 4.1 数据代理与缓存策略 (`api/vod/route.ts`)

为了避免前端直接向第三方数据源发起请求导致跨域问题（CORS）以及隐藏数据源真实地址，项目实现了一个聚合的数据代理接口 `/api/vod/route.ts`。
- **请求转发**: 接受前端传入的 `ac`, `pg`, `t`, `wd`, `h`, `ids` 等参数，将其拼接并转发至真实 API 地址 (`http://caiji.dyttzyapi.com/...`)。
- **动态缓存优化**:
  - 对于查询条件动态性强的数据（如 `wd` 搜索关键词、`ids` 影片特定详情、`h` 最近更新等），使用 `{ cache: 'no-store' }` 避免缓存导致的失效数据问题。
  - 对于常规的分类列表请求，利用 Next.js fetch API 的 `{ next: { revalidate: 3600 } }` 配置项实现长达 1 小时的 ISR 缓存，大幅降低目标服务器压力并提升系统响应速度。

### 4.2 访问密码保护 (`api/auth/route.ts`)

系统内置了访问密码保护机制，通过读取运行时的 Node 环境变量 `ACCESS_PASSWORD` 来启用基于 Cookie/Token 机制的局部鉴权。
- **状态探测 (GET)**: 提供了一个仅用于检查是否启用了密码保护的接口（内部基于 `!!process.env.ACCESS_PASSWORD`），避免将真实密码泄露到前端。
- **口令校验 (POST)**: 接收前端页面发起的密码，倘若与环境变量中的密码一致，则返回 `ok: true` 授权登录（返回 200）。否则阻断并返回 401 设置异常。
- 如果部署时未设置该环境变量，应用将自动跳过密码界面并放行所有访问。

### 4.3 在线视频播放 (HLS / m3u8)

系统支持原生的 M3U8 流媒体播放。基于集成的 `hls.js` 第三方依赖，可以在原生不支持该格式的现代桌面浏览器环境上实现视频流切片的加载与播放，无缝集成到应用详情页中提供沉浸式体验。

## 5. 部署与运维指南

MeTV 提供了多种灵活、适应性强的部署方式。

### 5.1 本地裸机运行 (Node/NPM)

适用于开发及轻量级本地化环境测试：
1. 依赖安装: `npm install`
2. 启动开发服务器: `npm run dev` (带密码功能测试: `ACCESS_PASSWORD=123456 npm run dev`)
3. 生产环境构建并运行: `npm run build` 然后 `npm run start -- --hostname 0.0.0.0 --port 3000`

### 5.2 Docker 容器化部署

利用预配置好的 `Dockerfile` (内部使用 Next.js `output: 'standalone'` 专门优化了镜像体积)。
- **构建本地镜像**: `docker build -t metv:latest .`
- **一键运行容器 (附带密码保护)**:
  ```bash
  docker run -d --name metv \
    -p 28301:3000 \
    -e ACCESS_PASSWORD=your_password_here \
    --restart unless-stopped \
    suxuefeng20/metv:latest
  ```

### 5.3 Linux 守护进程自动部署 (SystemD)

对于基于 Linux (Debian/Ubuntu/CentOS 等) 的服务器生产环境，项目根目录提供了 `install.sh` 一键部署脚本：
```bash
sudo ./install.sh
```
该自动化脚本执行了如下标准流程:
1. 通过 `npm ci` 拉取锁定的干净依赖
2. 通过 `npm run build` 执行项目构建
3. 挂载标准的 SystemD 进程守护配置文件至 `/etc/systemd/system/metv.service`
4. 立即激活并拉起守护服务及端口 (`systemctl start metv`)

该脚本亦可注入自定义部署实参，实现目录、所属用户和挂载端口的动态分配：
```bash
sudo ./install.sh --service-name metv --service-user www-data --app-dir /opt/MeTV --port 3000
```
当需要移除时，可以调用 `sudo ./uninstall.sh` 注销自动重启脚本及相关配置。

## 6. 后续开发建议

- **多数据源自动切换**: 考虑在 `src/lib/` 增加多个数据源的后备轮询策略，以保证当前采集源掉线时能自动触发并切换备用线路。
- **SEO基础优化**: 利用 Next.js App Router 强大的 Metadata API，可以把动态页面的 `generateMetadata` 继续完善，给到分享抓取侧更漂亮的封面卡片。
- **前端数据本地化**: 接入纯前端的轻量可持久化状态管理，实现纯端上的“历史播放足迹”与“追剧收藏夹”功能。
