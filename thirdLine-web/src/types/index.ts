// 与后端 thirdLine-api 的 VO / DTO / 通用结构一一对应

/** 统一响应结果 */
export interface Result<T> {
  code: number
  message: string
  data: T
}

/** 游标分页结果 */
export interface CursorPage<T> {
  records: T[]
  nextCursor: number | null
  hasMore: boolean
}

/** 标准分页结果（page/size） */
export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
}

/** 用户展示对象 */
export interface UserVO {
  id: number
  username: string
  nickname: string
  avatar: string | null
  email: string | null
  status: number
  createTime: string
}

/** 登录返回对象 */
export interface LoginVO {
  token: string
  userInfo: UserVO
}

/** 分类展示对象 */
export interface CategoryVO {
  id: number
  name: string
  sort: number
}

/** 标签展示对象 */
export interface TagVO {
  id: number
  name: string
}

/** 文章展示对象 */
export interface ArticleVO {
  id: number
  title: string
  content: string | null
  summary: string | null
  coverImage: string | null
  authorId: number
  authorName: string | null
  categoryId: number
  categoryName: string | null
  isTop: number
  isOriginal: number
  status: number
  publishedTime: string | null
  createdTime: string
  updatedTime: string | null
  tags: TagVO[]
}

/** 登录请求参数 */
export interface LoginDTO {
  username: string
  password: string
}

/** 修改用户信息请求参数 */
export interface UserUpdateDTO {
  nickname?: string
  avatar?: string
  email?: string
}

/** 修改密码请求参数 */
export interface PasswordUpdateDTO {
  oldPassword: string
  newPassword: string
}

/** 分类新增 / 修改请求参数 */
export interface CategoryDTO {
  id?: number
  name: string
  sort?: number
}

/** 标签新增 / 修改请求参数 */
export interface TagDTO {
  id?: number
  name: string
}

/** 新增文章请求参数 */
export interface ArticleSaveDTO {
  title: string
  content?: string
  summary?: string
  coverImage?: string
  categoryId?: number
  isTop?: number
  isOriginal?: number
  status?: number
  tagIds?: number[]
}

/** 修改文章请求参数 */
export interface ArticleUpdateDTO extends ArticleSaveDTO {
  id: number
}

/** 文章游标分页查询条件 */
export interface ArticleQuery {
  keyword?: string
  categoryId?: number
  tagId?: number
  status?: number
  cursor?: number | null
  size?: number
}

/** 文章状态枚举 */
export const ARTICLE_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
  DELETED: 2,
} as const

/** 网站基本信息统计 */
export interface SiteStatsVO {
  articleCount: number
  categoryCount: number
  tagCount: number
}

/** 照片展示对象 */
export interface PhotoVO {
  id: number
  title: string | null
  description: string | null
  url: string
  width: number | null
  height: number | null
  fileSize: number | null
  sort: number
  status: number
  createTime: string
  updateTime: string | null
}

/** 照片新增 / 修改请求参数 */
export interface PhotoDTO {
  id?: number
  title?: string
  description?: string
  /** 图片 URL：新增必填，局部修改（如切换显隐）时可不传 */
  url?: string
  width?: number
  height?: number
  fileSize?: number
  sort?: number
  status?: number
}

/** 照片分页查询条件 */
export interface PhotoQuery {
  page?: number
  size?: number
  status?: number
}

/** 照片状态枚举 */
export const PHOTO_STATUS = {
  HIDDEN: 0,
  VISIBLE: 1,
} as const
