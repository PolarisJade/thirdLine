/**
 * 图片占位工具。
 *
 * 需求里提到"可以用网上的一些图片进行占位，后续自行替换"，
 * 因此这里统一收口：后端返回空封面/空头像/空照片时，退回到联网占位图；
 * 想换成自己的图，只需改这一个文件里的常量。
 */

/** 占位图服务：picsum.photos 支持 seed 稳定出图（同一 seed 每次都是同一张） */
const PICSUM = 'https://picsum.photos/seed'

/** 站点主视觉大图（首页 Hero 背景） */
export const HERO_IMAGE = 'https://picsum.photos/seed/thirdline-hero/1600/900'

/** 关于/个人介绍区的配图 */
export const ABOUT_IMAGE = 'https://picsum.photos/seed/thirdline-about/900/900'

/** 文章无封面时的兜底图，按文章 id 稳定取图 */
export function articleCover(seed: string | number | null | undefined): string {
  return `${PICSUM}/tl-article-${seed ?? 'default'}/800/450`
}

/** 相册图片兜底 */
export function photoPlaceholder(seed: string | number | null | undefined): string {
  return `${PICSUM}/tl-photo-${seed ?? 'default'}/900/1200`
}

/** 作品集封面兜底 */
export function portfolioCover(seed: string | number | null | undefined): string {
  return `${PICSUM}/tl-work-${seed ?? 'default'}/800/500`
}

/** 音乐封面兜底 */
export function musicCover(seed: string | number | null | undefined): string {
  return `${PICSUM}/tl-music-${seed ?? 'default'}/400/400`
}

/** 头像兜底：用 DiceBear 生成卡通头像 */
export function avatarPlaceholder(seed: string | number | null | undefined): string {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(String(seed ?? 'thirdLine'))}&backgroundColor=f7a072,ffd9a0,c97b63`
}

/** 有值用后端的，没有则用占位图 */
export function withFallback(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback
}
