import { request } from './request'
import type { SiteStatsVO } from '@/types'

/** 网站基本信息统计：文章总数 / 分类总数 / 标签总数 */
export const getSiteStats = () => request.get<SiteStatsVO>('/user/site/stats')