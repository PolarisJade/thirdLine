# thirdLine-web

thirdLine 个人博客的**前端项目**，基于后端 `thirdLine-api` 的现有接口实现，包含**用户端**（温馨风格 · 液态玻璃组件）与**管理端**（富文本编辑器）。

技术栈：Vite 5 + React 18 + TypeScript + React Router 6 + Axios + wangEditor 5 + Radix UI（下拉框）。

---

## 一、快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 确认后端已启动（默认 http://localhost:8080）
#    thirdLine-api 需处于运行状态，且已执行过建表 SQL

# 3. 启动开发服务器
pnpm dev
# 打开 http://localhost:5173
```

### 可用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（含 `/api` 代理到后端） |
| `pnpm build` | 类型检查 + 生产构建，产物在 `dist/` |
| `pnpm preview` | 本地预览生产构建产物 |
| `pnpm typecheck` | 仅做 TypeScript 类型检查 |

### 环境变量

| 文件 | 变量 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `.env.development` | `VITE_API_BASE` | `/api` | 开发环境走 vite 代理，无需改 |
| `.env.production` | `VITE_API_BASE` | `/api` | 生产环境由网关反代；跨域时改成完整后端地址 |

开发环境下 `vite.config.ts` 会把 `/api/**` 代理到 `http://localhost:8080/**`（并去掉 `/api` 前缀）。
这样浏览器只访问同源地址，**既绕开了跨域，也能正常读取 `X-Refresh-Token` 续期响应头**。
如需代理到其它地址，设置环境变量 `VITE_PROXY_TARGET` 即可。

---

## 二、目录结构

```
src/
├─ api/                 # 与后端接口一一对应的封装
│  ├─ types.ts          #   所有 VO / DTO / Query 的 TypeScript 类型
│  ├─ client.ts         #   axios 实例：统一解包 Result、401 处理、token 续期
│  ├─ token.ts          #   token / 用户信息的本地存储 + 全局 401 通知
│  └─ index.ts          #   按模块划分的接口方法（userApi / articleApi / ...）
├─ components/          # 通用组件
│  ├─ Glass.tsx         #   液态玻璃容器（核心视觉组件）
│  ├─ Button / Form / Modal / Feedback / Icon
│  ├─ RichEditor.tsx    #   wangEditor 5 封装（管理端写文章用）
│  ├─ ImageUpload.tsx   #   图片 / 音频上传（对接 OSS 接口）
│  ├─ MusicPlayer.tsx   #   全局悬浮音乐播放器
│  └─ ArticleCard / WorkCard
├─ contexts/            # AuthProvider（登录态）、ThemeProvider（明暗主题）
├─ hooks/               # useAsync / usePaginatedList / useDebounced
├─ layouts/             # UserLayout（前台）、AdminLayout（后台）、页头页脚
├─ pages/
│  ├─ user/             # 用户端页面
│  └─ admin/            # 管理端页面
├─ routes/guards.tsx    # RequireAuth / RequireAdmin 路由守卫
├─ styles/              # 设计令牌 + 各层样式（CSS 变量驱动主题）
└─ utils/               # 格式化、占位图、主题读写
```

---

## 三、接口对接说明

所有数据均来自后端接口，前端**没有 mock 数据**。

### 统一响应处理

后端 `Result<T>` 始终返回 HTTP 200 + 业务 `code`，
`src/api/client.ts` 的响应拦截器会：

1. 读取 `X-Refresh-Token` 响应头，实现 **token 无感滑动续期**；
2. `code !== 200` 时抛出 `ApiError`（页面可直接展示后端 `message`）；
3. `code === 401` 时清理登录态并跳转登录页（管理端跳 `/admin/login`，前台跳 `/login`）；
4. 成功时把 `Result.data` 直接作为返回值，调用方无需层层解包。

### 用到的接口一览

| 模块 | 接口 | 用途 |
| --- | --- | --- |
| 站点 | `GET /user/site/stats` `GET /user/site/profile` | 首页统计、页脚与关于页的站主信息 |
| 文章 | `GET /user/article/page` `GET /user/article/{id}` | 首页 / 文章列表（游标分页）/ 文章详情 |
| 文章 | `GET POST PUT DELETE /admin/article`；列表 `GET /admin/article/page`（游标）/ `GET /admin/article/page-list`（标准分页） | 管理端文章增删改查、草稿与发布切换；表格用标准分页，游标接口保留 |
| 分类 | `GET /user/category/list`、`/admin/category` 全套 | 前台筛选、后台管理 |
| 标签 | `GET /user/tag/list`、`/admin/tag` 全套 | 同上 |
| 技术栈 | `GET /user/tech-stack/list`（仅启用项）、`/admin/tech-stack` 全套 | 作品集的技术栈字典，管理端可增删改与排序 |
| 相册 | `GET /user/photo/list`、`/admin/photo` 全套 | 前台瀑布流与灯箱、后台管理 |
| 作品集 | `GET /user/portfolio/list`、`/admin/portfolio` 全套 | 前台作品展示、后台管理；技术栈由 `tl_portfolio_tech_stack` 关联 `tl_tech_stack` 装配，请求/响应字段为 `techStackIds` / `techStacks` |
| 音乐 | `GET /user/music/list`、`/admin/music` 全套 | 悬浮播放器与音乐页、后台管理 |
| 用户 | `POST /user/user/login`、`/register`、`EMAIL /email/code`、`GET /user/user/info` | 登录注册与登录态校验 |
| 用户 | `PUT /admin/user/info`、`PUT /admin/user/password` | 个人中心 / 账号设置 |
| 上传 | `POST /admin/file/upload`、`/admin/file/upload-audio` | 图片与音频上传（阿里云 OSS） |

> 说明：后端 `/admin/**` 全部要求**管理员** token（`role === 0`），因此管理端路由额外做了角色校验；
> 普通用户登录后不会看到「管理后台」入口。

> OSS 旧文件清理：更新记录时如果图片 / 音频地址被**替换或删除**（文章封面、文章正文里被删掉的图片、相册原图、
> 作品集封面、音乐封面与音频、用户头像），后端会在**数据库更新提交成功之后**清掉旧文件
> （`OssReferenceServiceImpl` + `OssUtil.deleteByUrl`）。删除前会反查全站是否还有其它记录引用该地址
> （含文章正文 HTML、草稿 / 隐藏 / 下架记录、以及配置文件里的站主头像 `tl.host.avatar`），
> 仍被引用就保留；手填的第三方外链一律跳过；清理失败只记日志，不影响正常业务。

---

## 四、设计说明

### 液态玻璃（Liquid Glass）

核心在 `src/styles/glass.css`，一个 `.glass` 元素由四层视觉叠加而成：

1. 顶部受光面渐变（`::before`）
2. 悬浮时斜向扫过的液面反光（`::after` + `glass-sheen` 动画）
3. 半透明暖色底 + `backdrop-filter: blur() saturate()`
4. 顶部 inset 白色高光 + 外部柔和暖色投影

强度变体：`weak`（大面积容器）/ `strong`（保证文字可读）/ `subtle`（chip、按钮）/ `inset`（输入框、代码块）。
配合 `src/styles/base.css` 里的氛围光背景（4 团暖色 orb 缓慢漂移 + 细微噪点），
玻璃的模糊效果才有可透的内容，否则会显得发灰。

### 温馨配色与明暗主题

`src/styles/tokens.css` 用 CSS 变量定义两套主题：

- **亮色**：奶油米白底 `#fdf6ee` + 暖阳橘 `#f7a072` / `#ec8a5a`
- **暗色**：暖炭灰 `#191310`（刻意不用纯黑，避免压死玻璃透光感）

主题通过 `<html data-theme="light|dark">` 切换，记忆在 `localStorage`；
首次访问跟随系统 `prefers-color-scheme`。亮色主题名固定为 `light`（不跟随系统实时变化），其余选择逻辑见 `src/utils/theme.ts`。

### 占位图片

`src/utils/placeholder.ts` 统一收口所有占位图，后端返回空值时自动兜底：

| 场景 | 占位来源 |
| --- | --- |
| 首页 Hero / 关于配图 | `picsum.photos`（固定 seed） |
| 文章封面 | `picsum.photos/seed/tl-article-{id}` |
| 相册照片 | `picsum.photos/seed/tl-photo-{id}` |
| 作品封面 | `picsum.photos/seed/tl-work-{id}` |
| 音乐封面 | `picsum.photos/seed/tl-music-{id}` |
| 头像 | `api.dicebear.com`（卡通头像） |

**要换成自己的图，只需修改这一个文件里的常量。**

---

## 五、页面清单

### 用户端（风格温馨 · 液态玻璃）

| 路径 | 页面 | 主要接口 |
| --- | --- | --- |
| `/` | 首页：Hero、站点统计、最新文章、作品缩略、生活碎片、关于 | site stats/profile、article、portfolio、photo |
| `/articles` | 文章列表：关键词 / 分类 / 标签筛选 + 加载更多 | `/user/article/page` |
| `/articles/:id` | 文章详情：富文本正文、自动目录、阅读时长、相关阅读 | `/user/article/{id}` |
| `/portfolio` | 作品集：技术栈本地筛选（选项来自各作品的 `techStacks`） | `/user/portfolio/list` |
| `/gallery` | 相册：瀑布流 + 灯箱（支持 ←/→/Esc） | `/user/photo/list` |
| `/music` | 音乐页：独立播放器 + 歌单 | `/user/music/list` |
| `/about` | 关于我：名片、技能、时间线、站点数据 | site profile/stats |
| `/profile` | 个人中心：资料修改、头像上传、密码修改（需登录） | `/admin/user/info`、`/admin/user/password` |
| `/login` `/register` | 登录 / 注册（邮箱验证码） | `/user/user/login`、`/register`、`/email/code` |

### 管理端

| 路径 | 页面 |
| --- | --- |
| `/admin/login` | 管理员登录（校验 `role === 0`） |
| `/admin` | 数据看板：6 项统计卡、最近文章、快捷入口 |
| `/admin/articles` | 文章管理：状态/分类/标签筛选、发布↔草稿、删除 |
| `/admin/articles/new`、`/admin/articles/:id/edit` | **富文本编辑器**（wangEditor 5）+ 摘要 / 封面 / 分类 / 标签 / 置顶 / 原创 |
| `/admin/categories` | 分类管理（名称、排序、删除保护） |
| `/admin/tags` | 标签管理（含快速新增） |
| `/admin/tech-stacks` | 技术栈管理（名称、排序、启用/禁用、删除保护、快速新增） |
| `/admin/photos` | 相册管理（上传、尺寸与大小回填、显隐、排序） |
| `/admin/portfolio` | 作品集管理（**多选技术栈字典**、角色、周期、演示与仓库链接） |
| `/admin/music` | 音乐管理（音频上传 + 试听 + 上架/下架） |
| `/admin/settings` | 账号设置（资料、密码） |

---

## 六、部署

```bash
pnpm build
# 产物在 dist/，交给 nginx 托管
```

nginx 参考配置（`/api` 反代到后端，其余交给前端路由）：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/thirdLine-web/dist;
    index index.html;

    # 前端 history 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端接口
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # 让浏览器能读到 token 续期响应头
        proxy_pass_header X-Refresh-Token;
    }
}
```

> 若前端与后端不同域，把 `.env.production` 的 `VITE_API_BASE` 改成完整后端地址
> （后端 `WebMvcConfig` 已用 `allowedOriginPatterns("*")` 放开跨域，
> 并 `exposedHeaders("X-Refresh-Token")` 放行续期响应头）。

---

## 七、已知说明

- **富文本正文以 HTML 字符串存储**（后端 `tl_article.content` 为 `text` 类型，无需改动）。
  前台用 `.rich-text` 样式渲染，与编辑器中观感基本一致。
- 管理端所有页面（含编辑器）都走 `React.lazy` **按需加载**：编辑器约 281 KB（gzip）单独分包，
  只有进入 `/admin/articles/*` 才下载，`dist/index.html` 也不再 preload 它；
  前台首屏因此只剩「主包 + vendor + 一份 CSS」（约 149 KB gzip）。切换管理页时用
  `components/RouteFallback.tsx` 的「加载中…」占位。
- 下拉框基于 **Radix UI**（`@radix-ui/react-select`）自绘：触发器沿用 `.select` 玻璃外观，
  弹层是 `styles/ui.css` 里的 `.select-popover*`（玻璃底 + 品牌色高亮 + 选中打勾）；
  键盘操作（↑↓ / Enter / Esc / 首字母跳转）、焦点管理、aria 语义、点击外部关闭都由 Radix 负责。
  `components/Form.tsx` 的 `Select` 对外 props 与原生的 select 保持一致（`event.target.value`），
  因此业务调用处无需关心底层实现。
- 分页有两套并存：**前台文章流**走后端游标分页（`ArticleQuery` + `GET /user/article/page`），
  因此前台文章列表是「加载更多」而不是页码；**管理端文章表格**改用标准分页
  （`GET /admin/article/page-list`，返回 `total`，页码组件），
  管理端的相册 / 作品 / 音乐同样是标准分页。
  后端原有的游标接口 `GET /admin/article/page` 保持不动（仪表盘「最新文章」仍在使用）。
  分页条（`components/Feedback.tsx` 的 `Pagination`）在只有一页时也保留，并显示「第 X / Y 页 · 共 N 条」；
  管理端列表右侧还有「每页 N 条」选择器（默认 10 / 20 / 50，`usePaginatedList` 的 `setSize` 会自动回到第 1 页）。
- 作品集技术栈已从 `tl_portfolio.tech_stack`（逗号分隔字符串）拆成
  `tl_tech_stack`（字典）+ `tl_portfolio_tech_stack`（关联）两张表：
  后端 `PortfolioVO.techStacks` 由 `TechStackMapper.selectPortfolioTechStacks` 批量装配（避免 N+1），
  写入走 `PortfolioDTO.techStackIds`（修改时不传表示不动关系，传 `[]` 表示清空）；
  前台 `/portfolio` 的筛选与卡片、后台作品表单的多选 chips 都改从这两张表取值。
  数据迁移见 `thirdLine-api/sql/20261012_portfolio_tech_stack_migration.sql`。
  不会遮挡顶部导航，也不会干扰下方内容；发送框内联在 Hero 底部，不需要页面额外预留空白。
- 底部悬浮音乐播放器会覆盖页面左下角，`.page` 已通过 `--floating-clearance` 预留底部空间。
- `scripts/` 下的三个脚本只是**开发期辅助工具**，不参与构建，可随时删除：
  | 脚本 | 用途 |
  | --- | --- |
  | `shot.mjs` | 批量截图多个页面（`node scripts/shot.mjs <outDir> <chromePath> [light\|dark]`） |
  | `shot-viewport.mjs` | 按真实视口截图单个页面，用于核对浮层定位 |
  | `probe.mjs` | 读取页面实际几何信息，用于排查布局问题 |

---

## 八、联调注意事项（后端侧）

前端已按现有接口实现，实测时发现两处后端配置缺失，会导致**后端无法启动**或**个别数据为空**，建议补齐：

1. **`application-local.yml` 缺少 `tl.redis.port`**
   `application.yml` 中 `spring.data.redis.port: ${tl.redis.port}` 引用了该配置，
   但 `application-local.yml` 的 `tl.redis` 下只有 `host` / `password` / `database`，没有 `port`，
   启动会报 `Failed to bind properties under 'spring.data.redis.port' to int`。

   ```yaml
   tl:
     redis:
       host: localhost
       port: 6379        # ← 补充这一行
       password:
       database: 0
   ```

2. **`tl.host.startTime` 未配置**
   `SiteProfileVO.startTime`（本站运行起始日期）取的是 `tl.host.startTime`，
   当前未配置时返回 `null`，页脚与关于页会显示「已运行 0 天」。

   ```yaml
   tl:
     host:
       # ...
       start-time: 2024-01-01   # ← 补充建站日期
   ```

   以上两点均属后端配置，前端未作改动；前端对 `startTime` 为 `null` 的情况已做兜底（显示 0 天 / 「—」）。

3. **作品集技术栈需要跑一次数据迁移**
   新代码不再读写 `tl_portfolio.tech_stack`，历史数据必须先迁移到新表，否则已有作品的技术栈会变成空。

   ```bash
   # 1) 先备份（DROP COLUMN 之后旧值无法找回）
   mysqldump -uroot -p third_line tl_portfolio > tl_portfolio_backup.sql
   # 2) 执行迁移（脚本内分 0~6 步，第 4 步会打印核对结果，确认后再执行第 5 步 DROP COLUMN）
   mysql -uroot -p third_line < sql/20261012_portfolio_tech_stack_migration.sql
   ```

   ⚠️ **顺序很重要**：先部署新后端，再跑迁移脚本。
   旧后端（实体里还有 `techStack`）会 `SELECT ... tech_stack`，
   如果先 `DROP COLUMN`，旧代码会直接报 `Unknown column 'tech_stack'`。

