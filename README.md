# MeTV

MeTV 是一个基于 Next.js 的在线影视浏览与播放 Web 应用，支持分类浏览、搜索、详情页和 HLS (M3U8) 在线播放。

## 功能特性

- **全网多源聚合引擎**：并发采集 `config.json` 挂载的所有可用资源站，后台按照片名和时间智能去重合并。
- **无缝化多源播放切换**：详情页自适应聚合了各个有效采集站的直链资源卡片，可一键切换不同线路进行播放防止坏源。
- **客户端极速搜索筛选**：搜索结果页面将自动按源归类出所有可选站点，提供前端毫秒级的筛选过滤功能，告别二次页面刷新载入。
- **并发性能与 Node.js 内存拦截调度**：底层采用 AbortSignal 超时熔断机制拦截问题源，搭载底层强大的 Map 缓存机制实现次时代“零秒即开”。
- **全端视觉自适应定制**：针对各类竖屏与横屏优化的居中放大式 3D 海报轮播图与支持大触控面积交互的底部悬浮控制台。
- 首次访问免责声明弹窗
- 访问密码保护（通过环境变量配置）
- 服务端数据获取 + 智能缓存策略

## 技术栈

- Next.js 16 (App Router)
- React 19
- TypeScript
- hls.js
- ESLint

## 项目结构

```text
src/
  app/                   # Next.js 路由
    api/auth/route.ts    # 密码验证接口
    api/vod/route.ts     # 视频数据代理接口
    category/[id]/       # 分类页
    detail/[id]/         # 详情页
  components/            # UI 组件
  lib/                   # 数据请求与分类工具函数
public/                  # 静态资源
install.sh               # Linux 一键部署脚本
uninstall.sh             # Linux 卸载脚本
```

## 快速开始

### 环境要求

- Node.js 20+
- npm 10+

### 本地开发运行

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务器
npm run dev
```

访问 `http://localhost:3000`。

**如需测试访问密码功能：**

```bash
ACCESS_PASSWORD=123456 npm run dev
```

## 部署指南

### 方式一：Cloudflare Pages 部署 (推荐)

本项目原生支持部署到 Cloudflare Pages 环境，利用 Edge Runtime 实现高性能的全站边缘加速。

**1. 初次部署步骤**

- 登录 Cloudflare 控制台，进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
- 授权关联你的 GitHub/GitLab 仓库，并选择当前项目。
- 配置构建设置 (Build settings)：
  - **Framework preset**: `Next.js`
  - **Build command**: `npx @cloudflare/next-on-pages@1`
  - **Build output directory**: `.vercel/output/static`
- 点击 **Save and Deploy** 即可开始部署。

**2. 开启 Node.js 兼容性标志（必做项）**
为防止 Worker 运行时由于内部依赖 Node 原生模块（如 `node:buffer`）而报错白屏，必须开启兼容性标志：

- 在 Cloudflare Pages 此项目页面中，进入 **Settings (设置)** -> **Functions (函数)**。
- 找到下方的 **Compatibility flags (兼容性标志)** 配置区。
- 针对生产环境 (Production) 和预览环境 (Preview)，添加一条新的配置：`nodejs_compat`。
- 保存修改，并回到部署列表点击 **重新部署 (Retry Deployment)** 使配置完全生效。

**3. 配置访问密码（可选）**
如果希望保护你的站点不被随意访问，可以通过环境变量设置一个密码：

- 在 Cloudflare Pages 此项目页面中，进入 **Settings (设置)** -> **Environment variables (环境变量)**。
- 针对生产环境 (Production) 和预览环境 (Preview)，分别点击 **Add variable (添加变量)**。
- **Variable name (变量名)** 填写：`ACCESS_PASSWORD`
- **Value (值)** 填写：`你想设定的密码`（如 `123456`）。
- 保存设定并 **重新部署 (Retry Deployment)**。生效后，所有访客首次进入网站必须输入该密码。

### 方式二：Docker 部署

本项目提供 Dockerfile，使用 Next.js 的 `standalone` 输出模式，镜像体积小、启动快。

**1. 打包/构建 Docker 镜像**

```bash
# 在项目根目录下执行打包镜像命令
docker build -t metv:latest .
```

**2. 运行 Docker 容器**

```bash
docker run -d --name metv -p 28301:3000 --restart unless-stopped suxuefeng20/metv:latest
```

**3. 启用访问密码运行**
如需设置独立的访问密码，可以通过环境变量 `ACCESS_PASSWORD` 传递：

```bash
docker run -d --name metv \
  -p 28301:3000 \
  -e ACCESS_PASSWORD=your_password_here \
  --restart unless-stopped \
  suxuefeng20/metv:latest
```

运行后即可通过 `http://<服务器IP>:28301` 访问。

## 备注及进阶配置

- **数据源修改**：平台完全剥离了硬代码接口约束。API 配置规则均位于 `src/lib/config.json` 中。增删第三方影视数据源时只需照猫画虎在 JSON 里增减 Key-Value，项目将自动把它纳入到全局的并发检索和聚合系统中。
- **反向代理部署**：如果你使用 Nginx 或 Caddy 进行反向代理，只需将该域名的流量转发至本地监听的对应端口（如本文档中的 `127.0.0.1:3000` 或 Docker 映射的 `28301`）即可。
