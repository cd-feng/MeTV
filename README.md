# MeTV

MeTV 是一个基于 Next.js 的在线影视浏览与播放 Web 应用，支持分类浏览、搜索、详情页和 HLS (M3U8) 在线播放。

## 功能特性

- 首页轮播与分区板块展示
- 分类页面与关键词搜索
- 详情页选集与在线播放
- 亮色/暗色/跟随系统主题切换
- 移动端导航抽屉与全屏搜索
- 首次访问免责声明弹窗
- 访问密码保护（通过环境变量配置）
- 服务端数据获取 + 缓存策略

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

## 环境要求

- Node.js 20+
- npm 10+

## 本地开发

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

如需测试访问密码功能：

```bash
ACCESS_PASSWORD=123456 npm run dev
```

## 生产构建

```bash
npm install
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

## Docker 部署

本项目支持 Docker 镜像打包与容器化部署，Dockerfile 使用 Next.js `standalone` 输出模式，镜像体积小、启动快。

### 构建镜像

```bash
docker build -t metv:latest .
```

### 运行容器

```bash
docker run -d --name metv -p 28301:3000 --restart unless-stopped suxuefeng20/metv:latest
```

### 启用访问密码

通过环境变量 `ACCESS_PASSWORD` 设置访问密码，不设置则免密访问：

```bash
docker run -d --name metv \
  -p 28301:3000 \
  -e ACCESS_PASSWORD=your_password_here \
  --restart unless-stopped \
  suxuefeng20/metv:latest
```

访问 `http://<服务器IP>:28301`。

## Linux 一键部署（systemd）

项目提供 `install.sh` 和 `uninstall.sh` 脚本。

### 安装部署

```bash
chmod +x install.sh uninstall.sh
sudo ./install.sh
```

默认行为：

- 安装依赖（`npm ci`）
- 构建项目（`npm run build`）
- 创建 systemd 服务文件 `/etc/systemd/system/metv.service`
- 立即启动服务
- 不自动开机启动

### 服务管理

```bash
sudo systemctl start metv      # 启动
sudo systemctl restart metv    # 重启
sudo systemctl stop metv       # 停止
sudo systemctl status metv     # 查看状态
```

### 查看日志

```bash
sudo journalctl -u metv -f
```

### 自定义部署参数

```bash
sudo ./install.sh \
  --service-name metv \
  --service-user www-data \
  --app-dir /opt/MeTV \
  --port 3000
```

支持参数：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--service-name` | `metv` | 服务名称 |
| `--service-user` | 当前用户 | 运行用户 |
| `--app-dir` | 脚本所在目录 | 应用目录 |
| `--port` | `3000` | 监听端口 |

## 卸载

```bash
sudo ./uninstall.sh
```

默认行为：

- 停止并禁用服务
- 删除 `/etc/systemd/system/metv.service`
- 重载 systemd
- 保留项目文件不删除

指定服务名称卸载：

```bash
sudo ./uninstall.sh --service-name metv
```

## 备注

- 数据源 API 配置在 `src/lib/api.ts` 和 `src/app/api/vod/route.ts` 中。
- 如通过 Nginx 或 Caddy 反向代理，将流量转发至 `127.0.0.1:<端口>` 即可。
