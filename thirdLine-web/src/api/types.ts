/**
 * 与后端 thirdLine-api 一一对应的 TypeScript 类型定义。
 *
 * 命名与字段严格对齐 Java 侧的 VO / DTO / Query：
 *  - common/Result.java      -> ApiResult
 *  - common/CursorPage.java  -> CursorPage
 *  - common/PageResult.java  -> PageResult
 * 时间字段为 Jackson 序列化后的 LocalDateTime，形如 "2026-09-21T10:30:00"。
 */

/* ------------------------------------------------------------------ 通用 */

/** 统一响应结构 Result<T> */
export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

/** 游标分页结果 CursorPage<T>（文章列表使用） */
export interface CursorPage<T> {
  records: T[]
  /** 下一页游标，无更多数据时为 null */
  nextCursor: number | null
  hasMore: boolean
}

/** 标准分页结果 PageResult<T>（相册 / 作品 / 音乐 / 弹幕使用） */
export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
}

/** 后端 ResultCode 状态码，便于前端做精确分支判断 */
export const ResultCode = {
  SUCCESS: 200,
  ERROR: 500,
  PARAM_ERROR: 400,

  UNAUTHORIZED: 401,
  FORBIDDEN: 403,

  USER_NOT_FOUND: 1001,
  PASSWORD_ERROR: 1002,
  USER_DISABLED: 1003,
  OLD_PASSWORD_ERROR: 1004,
  SAME_PASSWORD: 1005,
  EMAIL_ALREADY_REGISTERED: 1006,
  USERNAME_ALREADY_EXISTS: 1007,
  EMAIL_CODE_ERROR: 1008,
  EMAIL_CODE_SEND_TOO_FREQUENT: 1009,

  CATEGORY_REQUIRED: 2002,
  CATEGORY_NAME_DUPLICATE: 2004,
  CATEGORY_IN_USE: 2005,

  TAG_NAME_DUPLICATE: 3003,

  DANMAKU_DISABLED: 7005,
  DANMAKU_REPORT_DUPLICATE: 7007,
} as const

/* ------------------------------------------------------------------ 用户 */

/** 角色：0 管理员 / 1 普通用户（对应 User.ROLE_ADMIN / ROLE_USER） */
export const ROLE_ADMIN = 0
export const ROLE_USER = 1

/** UserVO */
export interface UserVO {
  id: number
  username: string
  nickname: string | null
  avatar: string | null
  email: string | null
  /** 1 正常 / 0 禁用 */
  status: number
  /** 0 管理员 / 1 普通用户 */
  role: number
  createTime: string
}

/** LoginVO */
export interface LoginVO {
  token: string
  userInfo: UserVO
}

/** LoginDTO —— username 支持用户名或注册邮箱 */
export interface LoginDTO {
  username: string
  password: string
}

/** RegisterDTO —— 需先调用发送邮箱验证码接口 */
export interface RegisterDTO {
  email: string
  code: string
  username: string
  password: string
  nickname?: string
}

/** UserUpdateDTO —— 仅提交需要修改的字段 */
export interface UserUpdateDTO {
  nickname?: string
  avatar?: string
  email?: string
}

/** PasswordUpdateDTO */
export interface PasswordUpdateDTO {
  oldPassword: string
  newPassword: string
}

/* ------------------------------------------------------------ 文章 / 分类 / 标签 */

/** TagVO */
export interface TagVO {
  id: number
  name: string
}

/** CategoryVO */
export interface CategoryVO {
  id: number
  name: string
  sort: number | null
}

/** ArticleVO */
export interface ArticleVO {
  id: number
  title: string
  /** 列表接口不返回正文，详情接口才返回 */
  content: string | null
  summary: string | null
  coverImage: string | null
  authorId: number | null
  authorName: string | null
  categoryId: number | null
  categoryName: string | null
  /** 是否置顶：0 否 / 1 是 */
  isTop: number | null
  /** 是否原创：0 转载 / 1 原创 */
  isOriginal: number | null
  /** 状态：0 草稿 / 1 已发布 / 2 已删除 */
  status: number | null
  publishedTime: string | null
  createdTime: string | null
  updatedTime: string | null
  tags: TagVO[] | null
}

/** ArticleQuery —— 游标分页，size 上限 50 */
export interface ArticleQuery {
  keyword?: string
  categoryId?: number
  tagId?: number
  /** 前端浏览默认传 1，后台可按 0/1/2 过滤 */
  status?: number
  cursor?: number
  size?: number
}

/** ArticleSaveDTO */
export interface ArticleSaveDTO {
  title: string
  content?: string
  summary?: string
  coverImage?: string
  /** 必填 */
  categoryId: number
  isTop?: number
  isOriginal?: number
  /** 0 草稿 / 1 已发布，缺省为 1 */
  status?: number
  tagIds?: number[]
}

/** ArticleUpdateDTO —— tagIds 非空时整体覆盖标签关联 */
export interface ArticleUpdateDTO extends Partial<Omit<ArticleSaveDTO, 'categoryId'>> {
  id: number
  categoryId?: number
}

/** CategoryDTO —— 新增时 id 为空 */
export interface CategoryDTO {
  id?: number
  name: string
  sort?: number
}

/** TagDTO —— 新增时 id 为空 */
export interface TagDTO {
  id?: number
  name: string
}

/* ------------------------------------------------------------------ 相册 */

/** PhotoVO */
export interface PhotoVO {
  id: number
  title: string | null
  description: string | null
  url: string
  width: number | null
  height: number | null
  fileSize: number | null
  sort: number | null
  /** 0 隐藏 / 1 显示 */
  status: number | null
  createTime: string | null
  updateTime: string | null
}

/** PhotoQuery —— 标准分页，size 上限 100 */
export interface PhotoQuery {
  page?: number
  size?: number
  status?: number
}

/** PhotoDTO */
export interface PhotoDTO {
  id?: number
  title?: string
  description?: string
  /** 新增必填 */
  url?: string
  width?: number
  height?: number
  fileSize?: number
  sort?: number
  status?: number
}

/* ------------------------------------------------------------------ 作品集 */

/** PortfolioVO */
export interface PortfolioVO {
  id: number
  title: string
  summary: string | null
  coverImage: string | null
  /** 逗号分隔，如 "React,Spring Boot,MySQL" */
  techStack: string | null
  role: string | null
  period: string | null
  demoUrl: string | null
  repoUrl: string | null
  /** 0 草稿 / 1 已发布 / 2 已删除 */
  status: number | null
  publishTime: string | null
  createTime: string | null
  updateTime: string | null
}

/** PortfolioQuery */
export interface PortfolioQuery {
  page?: number
  size?: number
  keyword?: string
  status?: number
}

/** PortfolioDTO */
export interface PortfolioDTO {
  id?: number
  title: string
  summary?: string
  coverImage?: string
  techStack?: string
  role?: string
  period?: string
  demoUrl?: string
  repoUrl?: string
  /** 0 草稿 / 1 已发布 */
  status?: number
}

/* ------------------------------------------------------------------ 音乐 */

/** MusicVO */
export interface MusicVO {
  id: number
  title: string
  artist: string | null
  coverImage: string | null
  audioUrl: string
  sort: number | null
  /** 0 下架 / 1 上架 */
  status: number | null
  createTime: string | null
  updateTime: string | null
}

/** MusicQuery */
export interface MusicQuery {
  page?: number
  size?: number
  keyword?: string
  status?: number
}

/** MusicDTO */
export interface MusicDTO {
  id?: number
  title: string
  artist?: string
  coverImage?: string
  /** 新增必填 */
  audioUrl?: string
  sort?: number
  status?: number
}

/* ------------------------------------------------------------------ 弹幕 */

/** DanmakuVO */
export interface DanmakuVO {
  id: number
  userId: number | null
  nickname: string | null
  content: string
  color: string | null
  /** 0 隐藏 / 1 显示 */
  status: number | null
  /** 仅后台列表返回 */
  reportCount?: number | null
  createTime: string | null
}

/** DanmakuPoolVO —— 一次拉取即可渲染弹幕池 */
export interface DanmakuPoolVO {
  /** 全局开关，关闭时不展示也不允许发送 */
  enabled: boolean
  items: DanmakuVO[]
}

/** DanmakuSendDTO —— content 最长 100 字符，后端另有 5 秒限频 */
export interface DanmakuSendDTO {
  content: string
  color?: string
}

/** DanmakuReportDTO —— reason 最长 200 字符 */
export interface DanmakuReportDTO {
  danmakuId: number
  reason?: string
}

/** DanmakuQuery */
export interface DanmakuQuery {
  page?: number
  size?: number
  status?: number
}

/** DanmakuReportVO */
export interface DanmakuReportVO {
  id: number
  danmakuId: number
  danmakuContent: string | null
  danmakuNickname: string | null
  reporterNickname: string | null
  reason: string | null
  /** 0 待处理 / 1 已处理 */
  status: number | null
  createTime: string | null
}

/* ------------------------------------------------------------------ 站点 */

/** SiteStatsVO */
export interface SiteStatsVO {
  articleCount: number
  categoryCount: number
  tagCount: number
  photoCount: number
}

/** SiteProfileVO —— 数据来自后端配置文件 tl.host.* */
export interface SiteProfileVO {
  nickname: string | null
  email: string | null
  github: string | null
  avatar: string | null
  startTime: string | null
}
