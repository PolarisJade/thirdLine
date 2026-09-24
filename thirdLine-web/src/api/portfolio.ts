import { request } from './request'
import type { PageResult, PortfolioDTO, PortfolioQuery, PortfolioVO } from '@/types'

/** 查询全部已发布作品（前台作品集展示，按发布时间倒序） */
export const listPublishedPortfolios = () =>
  request.get<PortfolioVO[]>('/user/portfolio/list')

/** 分页查询作品（后台管理，需登录） */
export const pagePortfolios = (params: PortfolioQuery) =>
  request.get<PageResult<PortfolioVO>>('/admin/portfolio/page', { params })

/** 查询作品详情（后台，需登录） */
export const getPortfolio = (id: number) =>
  request.get<PortfolioVO>(`/admin/portfolio/${id}`)

/** 新增作品，返回作品ID（后台，需登录） */
export const savePortfolio = (data: PortfolioDTO) =>
  request.post<number>('/admin/portfolio', data)

/** 修改作品（后台，需登录） */
export const updatePortfolio = (data: PortfolioDTO) =>
  request.put<void>('/admin/portfolio', data)

/** 删除作品（后台，需登录） */
export const deletePortfolio = (id: number) =>
  request.delete<void>(`/admin/portfolio/${id}`)
