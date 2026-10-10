import { useEffect, useState } from 'react'
import { Icon } from '@/components/Icon'
import { useScrolled } from '@/hooks/useAsync'
import { cx } from '@/utils/format'

/** 回到顶部按钮，滚动超过一屏后出现 */
export function BackToTop() {
  const visible = useScrolled(600)
  const [pressed, setPressed] = useState(false)

  // 按压时给一点反馈
  useEffect(() => {
    if (!pressed) return
    const timer = window.setTimeout(() => setPressed(false), 300)
    return () => window.clearTimeout(timer)
  }, [pressed])

  if (!visible) return null

  return (
    <button
      type="button"
      className={cx('back-to-top glass glass--strong', pressed && 'glass--active')}
      onClick={() => {
        setPressed(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      aria-label="回到顶部"
      title="回到顶部"
    >
      <Icon name="arrowUp" size={19} />
    </button>
  )
}
