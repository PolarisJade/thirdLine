# 第三行 · 个人博客前端

React 19、Next.js 15 App Router、TypeScript、SWR。所有业务请求由浏览器直接访问外部 Java 后端；没有 Next API Routes、Server Actions 或接口代理。

## 启动

```powershell
cd D:\javaCode\thirdLine\thirdLine-web
npm install
Copy-Item .env.example .env.local
npm run dev
```

打开 http://localhost:3000。Java 后端默认 http://localhost:8080，在 `.env.local` 设置 `NEXT_PUBLIC_API_BASE_URL`（不追加 `/user`），修改后重启前端。生产环境设置为实际 HTTPS 后端地址，并确保 Java CORS 允许前端域名。

开发服务使用 `.next-dev`，生产构建和 `next start` 使用 `.next`，避免同时运行构建与开发时覆盖样式资源。如果旧服务仍在运行，请在其终端按 Ctrl+C 后重新执行 `npm run dev`，浏览器按 Ctrl+F5 刷新。若终端提示 3000 已占用，请打开终端显示的实际端口。

```powershell
npm run typecheck
npm run build
npm start
```

## 页面

| 路径 | 功能 |
| --- | --- |
| `/` | 首页、最近文章、站主资料、统计、标签索引 |
| `/articles` | 文章、分类和标签筛选、游标分页 |
| `/articles/[id]` | Markdown / 安全 HTML 正文、阅读目录、分享、本地收藏 |
| `/search` | 标题和摘要关键词搜索 |
| `/archive` | 按年份归档，继续加载更多历史文章 |
| `/album` | 瀑布流相册、大图预览、左右方向键翻页 |
| `/portfolio` | 作品、技术栈、演示和源码链接 |
| `/about` | 站主资料与联系方式 |
| `/auth` | 登录、邮箱验证码注册、发送倒计时 |
| `/account` | 登录状态、退出、管理员密码修改 |
| `/danmaku` | 弹幕池、发送、举报，尊重后端全局开关 |
| `/admin` | 管理员文章、分类、标签、相册、作品、音乐、上传、弹幕和举报管理 |

包含浅暗主题（默认跟随系统、手动选择记忆）、骨架加载、错误重试、空状态、404、移动端导航和减少动态效果支持。音乐按用户操作播放，不自动播放。暂未实现用户评论。

## 接口约定

- 响应：`{ code: 200, message, data }`，业务失败展示后端 `message`。
- 文章分页：`{ records, nextCursor, hasMore }`；公开页面传 `status=1`。
- 其他管理分页：`{ records, total, current, size }`。
- JWT：`Authorization: Bearer <token>`；读取 `X-Refresh-Token` 滑动续期。令牌保存在当前标签页的 sessionStorage，401 清除登录态。
- 个人介绍：`/user/site/profile`，统计：`/user/site/stats`，分类/标签/相册/作品/音乐：对应 `/user/{resource}/list`。
- 登录注册：`/user/user/login`、`/register`，验证码为 POST `/user/user/email/code?email=...`，登录校验 `/user/user/info`。
- 弹幕：`/user/danmaku/pool`、`/send`、`/report`；发送和举报需要登录。
- 管理：对应 `/admin/{resource}` CRUD；图片 `/admin/file/upload`，音频 `/admin/file/upload-audio`，表单字段 `file` 和 `module`。

`tl.host.*` 站主公开信息来自 Java 配置，修改管理员个人资料不会自动修改站主公开介绍。

## 尚未完善的功能

订阅更新、友情链接、忘记密码、普通用户资料/密码修改显示“该功能尚未完善”。普通用户不能调用 `/admin/user/*`，因为现有 Java 拦截器只允许管理员。收藏仅保存在当前浏览器，不宣称已同步到后端。

## 视觉资源

采用米白、森林绿与暖灰的阅读配色，中文标题使用本地宋体族，正文使用系统中文无衬线字体。无需联网下载字体。首页图片 `public/images/home-landscape.jpg` 复用仓库原有首页背景图。此次内置 image_gen 未返回可用图片，未接入生成图；尝试的提示词为：宁静秋日山湖、柔和鼠尾草绿森林、远山薄雾、岸边浅色木屋、晨光、自然低饱和配色、无文字无人物的写实横幅。

## 验证

浏览器测试使用独立的接口模拟数据，仅测试环境使用，应用不会在后端失败时混入示例文章。

```powershell
npx playwright install chromium
npm run test:e2e
```

测试覆盖公开接口加载、筛选和游标分页、正文 HTML 清理、登录注册请求、相册预览、未完善提示、暗色主题、移动端溢出、管理员访问限制、保存文章草稿和登录后发送弹幕。真实 Java 联调需要启动数据库、Redis、邮件及后端服务。

本次交付已通过 TypeScript 检查、Next.js 生产构建与 9 项 Edge 浏览器测试；依赖审计为 0 个漏洞。浏览器测试使用模拟 Java 响应，真实后端联调与 Lighthouse 性能评分尚未验证。已查看桌面浅色、暗色和 390px 移动端截图。

电脑已安装 Edge 时无需下载 Chromium，可执行：

```powershell
$env:PLAYWRIGHT_CHANNEL = "msedge"
npm run test:e2e
```
