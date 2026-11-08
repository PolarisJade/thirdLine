import { useEffect, useState } from 'react'

const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export default function HeroClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function tick() {
      const current = new Date()
      setNow(current)
      // Align each update to the next minute, including the date rollover.
      timer = setTimeout(tick, 60_000 - current.getTime() % 60_000)
    }
    function syncOnVisibility() {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer)
        tick()
      }
    }

    tick()
    document.addEventListener('visibilitychange', syncOnVisibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', syncOnVisibility)
    }
  }, [])

  const parts = clockFormatter.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''
  const date = part('day') + ' ' + part('month').toUpperCase() + ' ' + part('year')
  const weekday = part('weekday').toUpperCase()
  const time = part('hour') + ':' + part('minute')

  return <div className="hero-clock" role="timer" aria-live="off" aria-label="北京时间">
    <time className="hero-clock-date" dateTime={now.toISOString()}>{date}</time>
    <div className="hero-clock-weekday" aria-label={part('weekday')}>{weekday}</div>
    <time className="hero-clock-time" dateTime={now.toISOString()}>
      <span aria-hidden="true">-</span>{time}<span aria-hidden="true">-</span>
    </time>
  </div>
}
