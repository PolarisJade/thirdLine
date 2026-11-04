import { Link, useSearchParams } from 'react-router-dom'
import { dailyNoteApi, type DailyNoteDateVO } from '@/api/dailyNote'
import { DailyNoteLabel } from '@/components/DailyNoteLabel'
import { useAsync } from '@/hooks/useAsync'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Form'
import { EmptyState, Skeleton } from '@/components/Feedback'
import { Icon } from '@/components/Icon'

function groupDates(dates: DailyNoteDateVO[]) {
  const years = new Map<string, Map<string, DailyNoteDateVO[]>>()
  // 仅将时间目录按日期升序排列，正文默认选中和相邻篇目沿用原有顺序。
  for (const item of [...dates].sort((a, b) => a.noteDate.localeCompare(b.noteDate))) {
    const [year, month] = item.noteDate.split('-')
    const months = years.get(year) ?? new Map<string, DailyNoteDateVO[]>()
    const days = months.get(month) ?? []
    days.push(item)
    months.set(month, days)
    years.set(year, months)
  }
  return years
}

// 用选中ID作为组件key，切换时清空旧正文，并由useAsync忽略过时响应。
function NoteContent({ selected, previous, next }: {
  selected: DailyNoteDateVO
  previous?: DailyNoteDateVO
  next?: DailyNoteDateVO
}) {
  const { data, loading, error, reload } = useAsync(() => dailyNoteApi.detail(selected.id), [selected.id])
  return <div className="daily-note-content" id="daily-note-content" aria-busy={loading}>
    <Glass className="daily-note" variant="strong">
      {loading ? <div className="stack" role="status" aria-label="正在加载小记"><Skeleton width="45%" height={28} /><Skeleton height={160} /></div> : error ?
        <EmptyState icon="alert" title="小记加载失败" desc={error} action={<Button onClick={reload}>重试</Button>} /> : data ? <article>
          <header className="daily-note__header"><h2><time dateTime={data.noteDate}>{data.noteDate}</time></h2>
            <div className="row"><Badge><DailyNoteLabel kind="mood" value={data.mood} /></Badge><Badge tone="info"><DailyNoteLabel kind="weather" value={data.weather} /></Badge></div></header>
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: data.content }} />
          {data.publishTime && <footer className="daily-note__footer">发布于 <time dateTime={`${data.publishTime}+08:00`}>{data.publishTime.replace('T', ' ')}（北京时间）</time></footer>}
        </article> : null}
    </Glass>
    <nav className="daily-note-paging" aria-label="相邻日期的小记">
      {previous ? <Link to={`?date=${previous.noteDate}`}><Icon name="chevronLeft" size={16} /><span>较新一篇 · {previous.noteDate}</span></Link> : <span />}
      {next && <Link to={`?date=${next.noteDate}`}><span>较早一篇 · {next.noteDate}</span><Icon name="chevronRight" size={16} /></Link>}
    </nav>
  </div>
}

export function DailyNotePage() {
  const { data, loading, error, reload } = useAsync(dailyNoteApi.dates, [])
  const [params] = useSearchParams()
  const requestedDate = params.get('date')
  const dates = data ?? []
  const selected = requestedDate ? dates.find((item) => item.noteDate === requestedDate) : dates[0]
  const selectedIndex = selected ? dates.indexOf(selected) : -1
  const years = groupDates(dates)
  return <div className="container daily-note-page">
    <header className="page__header"><span className="section-head__eyebrow">Daily notes</span>
      <h1 className="page__title">日常小记</h1><p className="page__desc">把平常日子里的小事，慢慢记下来。</p></header>
    {loading ? <div className="daily-note-layout" role="status" aria-label="正在加载小记日期">
      <Glass className="daily-note-sidebar"><Skeleton height={240} /></Glass><Glass className="daily-note"><Skeleton height={240} /></Glass>
    </div> : error ? <Glass><EmptyState icon="alert" title="小记目录加载失败" desc={error} action={<Button onClick={reload}>重试</Button>} /></Glass> : !dates.length ?
      <Glass><EmptyState icon="article" title="还没有发布小记" desc="生活里的点滴，将会留在这里。" /></Glass> :
      <div className="daily-note-layout">
        <Glass className="daily-note-sidebar">
          <nav aria-label="按日期浏览小记">
            <div className="daily-note-sidebar__heading"><span><Icon name="calendar" size={18} />时间目录</span><span>{dates.length} 篇</span></div>
            <div className="daily-note-dates">
              {[...years].map(([year, months]) => <details className="daily-note-year" key={year} open>
                <summary>{year} 年<Icon name="chevronDown" size={14} /></summary>
                {[...months].map(([month, days]) => <div className="daily-note-month" key={month}>
                  <h3>{Number(month)} 月<span>{days.length} 篇</span></h3>
                  <ul>{days.map((item) => <li key={item.id}>
                    <Link to={`?date=${item.noteDate}`} aria-current={selected?.id === item.id ? 'date' : undefined}
                      aria-label={`阅读 ${item.noteDate} 的小记`}>
                      <span className="daily-note-date-dot" aria-hidden="true" />
                      <time dateTime={item.noteDate}>{Number(month)} 月 {Number(item.noteDate.slice(8))} 日</time>
                      {item.id === dates[0].id && <span className="daily-note-date-latest">最新</span>}
                    </Link>
                  </li>)}</ul>
                </div>)}
              </details>)}
            </div>
          </nav>
        </Glass>
        {selected ? <NoteContent key={selected.id} selected={selected} previous={dates[selectedIndex - 1]} next={dates[selectedIndex + 1]} /> :
          <Glass className="daily-note"><EmptyState icon="calendar" title="该日期暂无已发布小记" desc="可以从时间目录选择其他日期。"
            action={<Link className="btn btn--glass" to="/notes">查看最新小记</Link>} /></Glass>}
      </div>}
  </div>
}
