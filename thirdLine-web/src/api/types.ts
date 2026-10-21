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

/** 标准分页结果 PageResult<T>（相册 / 作品 / 音乐使用） */
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

  FRIEND_LINK_URL_INVALID: 10004,
  FRIEND_LINK_URL_DUPLICATE: 10005,
  FRIEND_LINK_SENSITIVE: 10006,

  WALL_DISABLED: 11001,
  WALL_NOTE_NOT_FOUND: 11002,
  WALL_NOTE_CONTENT_EMPTY: 11003,
  WALL_NOTE_CONTENT_TOO_LONG: 11004,
  WALL_NOTE_SENSITIVE: 11005,
  WALL_NOTE_TOO_FREQUENT: 11006,
  WALL_NOTE_DAILY_LIMIT: 11007,
  WALL_FULL: 11008,
  WALL_POSITION_CONFLICT: 11009,
  WALL_NOTE_FORBIDDEN: 11010,
  WALL_REPORT_DUPLICATE: 11011,
  WALL_REPORT_SELF: 11012,
  WALL_REPORT_REASON_INVALID: 11013,
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

/** TechStackVO —— 技术栈字典项（作品集子模块，对应 tl_tech_stack） */
export interface TechStackVO {
  id: number
  name: string
  /** 排序值，越小越靠前 */
  sort: number | null
  /** 0 禁用 / 1 启用 */
  status: number | null
}

/** TechStackDTO */
export interface TechStackDTO {
  id?: number
  name: string
  sort?: number
  /** 0 禁用 / 1 启用 */
  status?: number
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

/** ArticlePageQuery —— 管理端标准分页（page/size + 同一套筛选条件，size 上限 100） */
export interface ArticlePageQuery {
  page?: number
  size?: number
  keyword?: string
  categoryId?: number
  tagId?: number
  /** 0 草稿 / 1 已发布 / 2 已删除 */
  status?: number
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
  /** 关联的技术栈，来自 tl_portfolio_tech_stack + tl_tech_stack（按 sort 升序） */
  techStacks: TechStackVO[] | null
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
  /** 关联的技术栈ID；修改时不传表示不动已有关系，传 [] 表示清空 */
  techStackIds?: number[]
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

/* ------------------------------------------------------------------ 友链 */

/**
 * FriendLinkVO —— 前台可见友链，对应后端 FriendLinkVO。
 * 后端刻意只下发展示字段，申请人邮箱、内部备注、审核状态都不在返回里。
 */
export interface FriendLinkVO {
  id: number
  name: string
  url: string
  /** 站点图标，为空时前端用站点名首字母兜底 */
  avatar: string | null
  description: string | null
}

/** FriendLinkApplyDTO —— 友链申请，长度限制与后端校验一致 */
export interface FriendLinkApplyDTO {
  /** 站点名称，必填，最长 64 */
  name: string
  /** 站点地址，必填，需 http/https */
  url: string
  /** 站点图标地址，最长 500 */
  avatar?: string
  /** 站点描述，最长 255 */
  description?: string
  /** 联系邮箱，仅后台可见 */
  email?: string
}

/**
 * FriendLinkAdminVO —— 后台管理对象，对应后端 FriendLinkAdminVO。
 * 相比 FriendLinkVO 多出申请人邮箱、来源、审核信息与内部备注。
 */
export interface FriendLinkAdminVO {
  id: number
  name: string
  url: string
  avatar: string | null
  description: string | null
  email: string | null
  /** 申请用户ID，游客申请时为 null */
  applyUserId: number | null
  /** 来源：0 管理员添加 / 1 访客申请 */
  source: number | null
  /** 审核状态：0 待审核 / 1 已通过 / 2 已拒绝 */
  auditStatus: number | null
  rejectReason: string | null
  /** 显示状态：0 隐藏 / 1 显示 */
  status: number | null
  remark: string | null
  auditTime: string | null
  createTime: string | null
  updateTime: string | null
}

/** FriendLinkDTO —— 后台新增/修改；修改时字段为 null 表示不动，可空文本传空串表示清空 */
export interface FriendLinkDTO {
  id?: number
  name: string
  url: string
  avatar?: string
  description?: string
  email?: string
  /** 显示状态：0 隐藏 / 1 显示 */
  status?: number
  remark?: string
}

/** FriendLinkAuditDTO —— 审核结果：1 通过 / 2 拒绝，拒绝时 rejectReason 必填 */
export interface FriendLinkAuditDTO {
  id: number
  auditStatus: number
  rejectReason?: string
}

/** FriendLinkQuery —— 后台标准分页（后端把待审核排最前） */
export interface FriendLinkQuery {
  page?: number
  size?: number
  keyword?: string
  /** 0 待审核 / 1 已通过 / 2 已拒绝 */
  auditStatus?: number
  /** 0 隐藏 / 1 显示 */
  status?: number
  /** 0 管理员添加 / 1 访客申请 */
  source?: number
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

/* ------------------------------------------------------------------ 留言墙 */

/** 信纸颜色选项，对应 WallColorVO */
export interface WallColorVO {
  /** 落库用的 key：pink / purple / yellow / orange / green / blue */
  key: string
  label: string
  /** 十六进制色值 */
  color: string
}

/**
 * 墙面配置 WallConfigVO。
 * 画布 / 信纸尺寸由后端下发，前端不要写死，否则拖动预览和服务端裁决会用两套参数。
 */
export interface WallConfigVO {
  enabled: boolean
  notice: string
  maxLength: number
  maxNotes: number
  canvasWidth: number
  canvasHeight: number
  paperWidth: number
  paperHeight: number
  /** 信纸之间的安全间距 */
  gap: number
  /** 坐标吸附粒度 */
  grid: number
  palette: WallColorVO[]
}

/** 前台信纸 WallNoteVO */
export interface WallNoteVO {
  id: number
  content: string
  paperColor: string
  /** 左上角 X（逻辑画布坐标） */
  posX: number
  /** 左上角 Y（逻辑画布坐标） */
  posY: number
  rotateDeg: number
  /** 乐观锁版本号，拖动确认时回传 */
  version: number
  createTime: string
  /** 是否是当前登录用户贴的 */
  owned: boolean
  /** 是否还在审核中（只有自己的待审核留言会出现在公开列表里） */
  pending: boolean
}

/** 整面墙 WallListVO */
export interface WallListVO {
  notes: WallNoteVO[]
  /** 墙面版本号，用于轮询判断是否需要重绘 */
  version: number
  maxNotes: number
}

/** 提交留言 WallNoteCreateDTO */
export interface WallNoteCreateDTO {
  content: string
  paperColor: string
  posX: number
  posY: number
}

/** 拖动确认 WallNoteMoveDTO */
export interface WallNoteMoveDTO {
  posX: number
  posY: number
  version: number
}

/** 拖动确认结果 WallMoveResultVO */
export interface WallMoveResultVO {
  id: number
  posX: number
  posY: number
  version: number
  /** 服务端是否调整了位置（落点被占 / 被夹到画布内） */
  adjusted: boolean
}

/** 举报 WallNoteReportDTO */
export interface WallNoteReportDTO {
  /** 1垃圾广告 2辱骂攻击 3色情低俗 4政治敏感 5违法信息 6其他 */
  reasonType: number
  reason?: string
}

/** 后台留言 WallNoteAdminVO */
export interface WallNoteAdminVO {
  id: number
  content: string
  paperColor: string
  posX: number
  posY: number
  rotateDeg: number
  /** 0待审核 1已通过 2已拒绝 */
  auditStatus: number
  auditRemark: string | null
  auditTime: string | null
  /** 0隐藏 1显示 */
  status: number
  reportCount: number
  /** 作者 ID，仅后台可见 */
  userId: number
  version: number
  createTime: string
  updateTime: string
}

/** 后台留言查询 WallNoteQuery */
export interface WallNoteQuery {
  page?: number
  size?: number
  keyword?: string
  auditStatus?: number
  status?: number
}

/** 审核 WallNoteAuditDTO */
export interface WallNoteAuditDTO {
  /** 1通过 2拒绝 */
  auditStatus: number
  /** 拒绝时必填 */
  auditRemark?: string
}

/** 后台举报 WallReportAdminVO */
export interface WallReportAdminVO {
  id: number
  noteId: number
  /** 留言已被删除时为 null */
  noteContent: string | null
  /** 被举报留言当前显示状态 */
  noteStatus: number | null
  reporterUserId: number
  /** 1垃圾广告 2辱骂攻击 3色情低俗 4政治敏感 5违法信息 6其他 */
  reasonType: number
  reason: string | null
  /** 0待处理 1成立 2不成立 */
  status: number
  handleRemark: string | null
  handleTime: string | null
  createTime: string
}

/** 后台举报查询 WallReportQuery */
export interface WallReportQuery {
  page?: number
  size?: number
  status?: number
}

/** 举报处理 WallReportHandleDTO */
export interface WallReportHandleDTO {
  /** 1成立 2不成立 */
  status: number
  handleRemark?: string
}
