import { api } from './client'
import type {
  ArticleQuery,
  ArticleSaveDTO,
  ArticleUpdateDTO,
  ArticleVO,
  CategoryDTO,
  CategoryVO,
  CursorPage,
  DanmakuPoolVO,
  DanmakuQuery,
  DanmakuReportDTO,
  DanmakuReportVO,
  DanmakuSendDTO,
  DanmakuVO,
  LoginDTO,
  LoginVO,
  MusicDTO,
  MusicQuery,
  MusicVO,
  PageResult,
  PasswordUpdateDTO,
  PhotoDTO,
  PhotoQuery,
  PhotoVO,
  PortfolioDTO,
  PortfolioQuery,
  PortfolioVO,
  RegisterDTO,
  SiteProfileVO,
  SiteStatsVO,
  TagDTO,
  TagVO,
  UserUpdateDTO,
  UserVO,
} from './types'

/* ============================================================ 用户 / 登录注册 */

export const userApi = {
  /** 登录，账号支持用户名或注册邮箱（POST /user/user/login） */
  login: (dto: LoginDTO) => api.post<LoginVO>('/user/user/login', dto),

  /** 注册（POST /user/user/register），需先获取邮箱验证码 */
  register: (dto: RegisterDTO) => api.post<LoginVO>('/user/user/register', dto),

  /** 发送注册邮箱验证码（POST /user/user/email/code?email=），60 秒内同一邮箱限一次 */
  sendEmailCode: (email: string) =>
    api.post<void>('/user/user/email/code', undefined, { params: { email } }),

  /** 当前登录用户信息（GET /user/user/info），未登录返回 code 401 */
  info: () => api.get<UserVO>('/user/user/info'),

  /** 修改当前登录用户资料（PUT /admin/user/info），仅提交需修改字段 */
  updateInfo: (dto: UserUpdateDTO) => api.put<UserVO>('/admin/user/info', dto),

  /** 修改密码（PUT /admin/user/password） */
  updatePassword: (dto: PasswordUpdateDTO) => api.put<void>('/admin/user/password', dto),
}

/* ================================================================== 文章 */

export const articleApi = {
  /** 前台游标分页（GET /user/article/page），size 上限 50 */
  page: (query: ArticleQuery) => api.get<CursorPage<ArticleVO>>('/user/article/page', query),

  /** 前台文章详情（GET /user/article/{id}），含正文与标签 */
  detail: (id: number) => api.get<ArticleVO>(`/user/article/${id}`),

  /** 后台游标分页（GET /admin/article/page），可按 status 过滤草稿 */
  adminPage: (query: ArticleQuery) => api.get<CursorPage<ArticleVO>>('/admin/article/page', query),

  /** 后台文章详情，用于编辑回填 */
  adminDetail: (id: number) => api.get<ArticleVO>(`/admin/article/${id}`),

  /** 新增文章（POST /admin/article），返回新文章 ID */
  save: (dto: ArticleSaveDTO) => api.post<number>('/admin/article', dto),

  /** 修改文章（PUT /admin/article） */
  update: (dto: ArticleUpdateDTO) => api.put<void>('/admin/article', dto),

  /** 删除文章（DELETE /admin/article/{id}），级联删除标签关联 */
  remove: (id: number) => api.delete<void>(`/admin/article/${id}`),
}

/* ================================================================== 分类 */

export const categoryApi = {
  /** 前台分类列表（GET /user/category/list） */
  list: () => api.get<CategoryVO[]>('/user/category/list'),

  /** 后台分类列表 */
  adminList: () => api.get<CategoryVO[]>('/admin/category/list'),

  /** 新增分类（POST /admin/category），名称不可重复 */
  save: (dto: CategoryDTO) => api.post<number>('/admin/category', dto),

  /** 修改分类名称与排序（PUT /admin/category） */
  update: (dto: CategoryDTO) => api.put<void>('/admin/category', dto),

  /** 删除分类（DELETE /admin/category/{id}），分类下有文章时后端拒绝 */
  remove: (id: number) => api.delete<void>(`/admin/category/${id}`),
}

/* ================================================================== 标签 */

export const tagApi = {
  /** 前台标签列表（GET /user/tag/list） */
  list: () => api.get<TagVO[]>('/user/tag/list'),

  /** 后台标签列表 */
  adminList: () => api.get<TagVO[]>('/admin/tag/list'),

  /** 新增标签（POST /admin/tag） */
  save: (dto: TagDTO) => api.post<number>('/admin/tag', dto),

  /** 重命名标签（PUT /admin/tag） */
  update: (dto: TagDTO) => api.put<void>('/admin/tag', dto),

  /** 删除标签（DELETE /admin/tag/{id}），已关联文章时后端拒绝 */
  remove: (id: number) => api.delete<void>(`/admin/tag/${id}`),
}

/* ================================================================== 相册 */

export const photoApi = {
  /** 前台可见照片（GET /user/photo/list），按 sort 升序 */
  list: () => api.get<PhotoVO[]>('/user/photo/list'),

  /** 后台分页（GET /admin/photo/page） */
  adminPage: (query: PhotoQuery) => api.get<PageResult<PhotoVO>>('/admin/photo/page', query),

  /** 后台照片详情 */
  adminDetail: (id: number) => api.get<PhotoVO>(`/admin/photo/${id}`),

  /** 新增照片（POST /admin/photo），sort 为空时自动追加末尾 */
  save: (dto: PhotoDTO) => api.post<number>('/admin/photo', dto),

  /** 修改照片（PUT /admin/photo） */
  update: (dto: PhotoDTO) => api.put<void>('/admin/photo', dto),

  /** 删除照片（DELETE /admin/photo/{id}） */
  remove: (id: number) => api.delete<void>(`/admin/photo/${id}`),
}

/* ================================================================== 作品集 */

export const portfolioApi = {
  /** 前台已发布作品（GET /user/portfolio/list），按发布时间倒序 */
  list: () => api.get<PortfolioVO[]>('/user/portfolio/list'),

  /** 后台分页（GET /admin/portfolio/page） */
  adminPage: (query: PortfolioQuery) => api.get<PageResult<PortfolioVO>>('/admin/portfolio/page', query),

  /** 后台作品详情 */
  adminDetail: (id: number) => api.get<PortfolioVO>(`/admin/portfolio/${id}`),

  /** 新增作品（POST /admin/portfolio） */
  save: (dto: PortfolioDTO) => api.post<number>('/admin/portfolio', dto),

  /** 修改作品（PUT /admin/portfolio） */
  update: (dto: PortfolioDTO) => api.put<void>('/admin/portfolio', dto),

  /** 删除作品（DELETE /admin/portfolio/{id}） */
  remove: (id: number) => api.delete<void>(`/admin/portfolio/${id}`),
}

/* ================================================================== 音乐 */

export const musicApi = {
  /** 前台已上架音乐（GET /user/music/list），按 sort 升序，供悬浮播放器使用 */
  list: () => api.get<MusicVO[]>('/user/music/list'),

  /** 后台分页（GET /admin/music/page） */
  adminPage: (query: MusicQuery) => api.get<PageResult<MusicVO>>('/admin/music/page', query),

  /** 后台音乐详情 */
  adminDetail: (id: number) => api.get<MusicVO>(`/admin/music/${id}`),

  /** 新增音乐（POST /admin/music） */
  save: (dto: MusicDTO) => api.post<number>('/admin/music', dto),

  /** 修改音乐（PUT /admin/music） */
  update: (dto: MusicDTO) => api.put<void>('/admin/music', dto),

  /** 删除音乐（DELETE /admin/music/{id}） */
  remove: (id: number) => api.delete<void>(`/admin/music/${id}`),
}

/* ================================================================== 弹幕 */

export const danmakuApi = {
  /** 弹幕池（GET /user/danmaku/pool），返回全局开关 + 可见弹幕，匿名可访问 */
  pool: (limit = 50) => api.get<DanmakuPoolVO>('/user/danmaku/pool', { limit }),

  /** 发送弹幕（POST /user/danmaku/send），需登录，后端 5 秒限频 */
  send: (dto: DanmakuSendDTO) => api.post<DanmakuVO>('/user/danmaku/send', dto),

  /** 举报弹幕（POST /user/danmaku/report），需登录，同一弹幕不可重复举报 */
  report: (dto: DanmakuReportDTO) => api.post<void>('/user/danmaku/report', dto),

  /** 后台弹幕分页（GET /admin/danmaku/page） */
  adminPage: (query: DanmakuQuery) => api.get<PageResult<DanmakuVO>>('/admin/danmaku/page', query),

  /** 切换弹幕显隐（PUT /admin/danmaku/{id}/status?status=0|1） */
  updateStatus: (id: number, status: number) =>
    api.put<void>(`/admin/danmaku/${id}/status`, undefined, { status }),

  /** 删除弹幕（DELETE /admin/danmaku/{id}） */
  remove: (id: number) => api.delete<void>(`/admin/danmaku/${id}`),

  /** 举报记录分页（GET /admin/danmaku/report/page） */
  reportPage: (status: number | undefined, page = 1, size = 12) =>
    api.get<PageResult<DanmakuReportVO>>('/admin/danmaku/report/page', { status, page, size }),

  /** 标记举报已处理（PUT /admin/danmaku/report/{id}/handle） */
  handleReport: (id: number) => api.put<void>(`/admin/danmaku/report/${id}/handle`),

  /** 查询弹幕全局开关（GET /admin/danmaku/switch） */
  getSwitch: () => api.get<boolean>('/admin/danmaku/switch'),

  /** 设置弹幕全局开关（PUT /admin/danmaku/switch?enabled=） */
  setSwitch: (enabled: boolean) => api.put<void>('/admin/danmaku/switch', undefined, { enabled }),
}

/* ================================================================== 站点 */

export const siteApi = {
  /** 站点统计（GET /user/site/stats） */
  stats: () => api.get<SiteStatsVO>('/user/site/stats'),

  /** 站主介绍（GET /user/site/profile），数据来自后端配置文件 */
  profile: () => api.get<SiteProfileVO>('/user/site/profile'),
}

/* ================================================================== 文件上传 */

export const fileApi = {
  /**
   * 上传图片（POST /admin/file/upload）
   * @param file   图片文件
   * @param module 业务目录：avatar | cover | photo | portfolio | common
   */
  uploadImage: (file: File, module = 'common') => {
    const form = new FormData()
    form.append('file', file)
    form.append('module', module)
    return api.upload<string>('/admin/file/upload', form)
  },

  /** 上传音频（POST /admin/file/upload-audio），用于音乐模块 */
  uploadAudio: (file: File, module = 'music') => {
    const form = new FormData()
    form.append('file', file)
    form.append('module', module)
    return api.upload<string>('/admin/file/upload-audio', form)
  },
}

export * from './types'
