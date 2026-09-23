import { pastelOf } from '@/utils/format'

interface PillProps {
  label: string
  seed: number | string
  onClick?: () => void
}

/** minimalist-ui 柔色 pill，用于标签 / 分类展示 */
export default function Pill({ label, seed, onClick }: PillProps) {
  const { bg, fg } = pastelOf(seed)
  return (
    <span
      className="mui-pill"
      style={{ background: bg, color: fg, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {label}
    </span>
  )
}
