import { request } from './request'
import type { SiteProfileVO, SiteStatsVO } from '@/types'

/** 网站基本信息统计：文章总数 / 分类总数 / 标签总数 / 相册照片总数 */
export const getSiteStats = () => request.get<SiteStatsVO>('/user/site/stats')

/** 站主个人介绍：昵称 / 邮箱 / GitHub / 头像，信息来自后端配置文件 */
export const getSiteProfile = () => request.get<SiteProfileVO>('/user/site/profile')