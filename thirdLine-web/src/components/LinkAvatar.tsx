import { useState } from 'react'
import { cx, initialOf } from '@/utils/format'

/**
 * 站点图标（友链用）。
 *
 * 没填图标地址、或图片加载失败时，退回到站点名首字母的暖色方块，不留破图。
 * 前台友链墙与后台友链管理共用，样式见 styles/user.css 的 .link-avatar。
 */
export function LinkAvatar({
  src,
  name,
  large = false,
}: {
  src?: string | null
  name: string
  large?: boolean
}) {
  const [broken, setBroken] = useState(false)
  const showImage = Boolean(src && src.trim() && !broken)

  return (
    <span className={cx('link-avatar', large && 'link-avatar--lg')} aria-hidden="true">
      {showImage ? <img src={src ?? ''} alt="" loading="lazy" onError={() => setBroken(true)} /> : initialOf(name)}
    </span>
  )
}
