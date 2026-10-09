export type ID = number | string;
export interface Taxonomy { id: ID; name: string; sort?: number }
export interface Article { id: ID; title: string; content?: string; summary?: string; coverImage?: string; authorName?: string; categoryId?: ID; categoryName?: string; isTop?: number; isOriginal?: number; status?: number; publishedTime?: string; createdTime?: string; tags?: Taxonomy[] }
export interface CursorPage<T> { records: T[]; nextCursor: ID | null; hasMore: boolean }
export interface PageResult<T> { records: T[]; total: number; current: number; size: number }
export interface Profile { nickname: string; email?: string; github?: string; avatar?: string; startTime?: string }
export interface Stats { articleCount: number; categoryCount: number; tagCount: number; photoCount: number }
export interface Photo { id: ID; title: string; description?: string; url: string }
export interface Portfolio { id: ID; title: string; summary?: string; coverImage?: string; techStack?: string; role?: string; period?: string; demoUrl?: string; repoUrl?: string }
export interface Music { id: ID; title: string; artist?: string; coverImage?: string; audioUrl: string }
export interface User { id: ID; username: string; nickname: string; avatar?: string; email?: string; role: number }
export interface Login { token: string; userInfo: User }
export interface Danmaku { id: ID; userId: ID; nickname: string; content: string; color?: string; status?: number; reportCount?: number }
export interface Pool { enabled: boolean; items: Danmaku[] }
