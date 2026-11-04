import { moodOptions, weatherOptions } from '@/api/dailyNote'
import { Icon } from './Icon'

/** 心情、天气在列表和前台共用的图文标签。 */
export function DailyNoteLabel({ kind, value }: { kind: 'mood' | 'weather'; value: number | null }) {
  const option = (kind === 'mood' ? moodOptions : weatherOptions).find((item) => item.value === value)
  return <span className="daily-note-label" aria-label={`${kind === 'mood' ? '心情' : '天气'}：${option?.label ?? '未选择'}`}>
    {option && <Icon name={option.icon} size={18} />}
    {option?.label ?? '未选择'}
  </span>
}
