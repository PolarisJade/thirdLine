import { Link } from 'react-router-dom'
import { articleApi, type ArticleArchiveVO } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { EmptyState, Skeleton } from '@/components/Feedback'
import { Icon } from '@/components/Icon'

type MonthGroup = {
  key: string
  label: string
  days: ArticleArchiveVO[]
  count: number
}

type YearGroup = {
  year: string
  months: Map<string, MonthGroup>
  count: number
}

function buildYearGroups(data: ArticleArchiveVO[]): YearGroup[] {
  const years = new Map<string, YearGroup>()
  for (const day of data) {
    const [year, month] = day.date.split('-')
    const key = `${year}-${month}`
    const currentYear = years.get(year) ?? { year, months: new Map<string, MonthGroup>(), count: 0 }
    const current = currentYear.months.get(key) ?? {
      key,
      label: `${Number(month)} 月`,
      days: [],
      count: 0,
    }
    current.days.push(day)
    current.count += day.articles.length
    currentYear.months.set(key, current)
    currentYear.count += day.articles.length
    years.set(year, currentYear)
  }
  return [...years.values()]
}

function formatDay(date: string) {
  const [, month, day] = date.split('-')
  return `${Number(month)} 月 ${Number(day)} 日`
}

export function ArticleArchivePage() {
  const { data, loading, error, reload } = useAsync(articleApi.archive, [])
  const years = buildYearGroups(data ?? [])
  const total = (data ?? []).reduce((sum, item) => sum + item.articles.length, 0)

  return (
    <div className="container article-archive-page">
      <header className="page__header">
        <h1 className="page__title">文章归档</h1>
        <p className="page__desc">按发布日期回看这里写下的每一篇文章。</p>
      </header>

      {loading ? (
        <div className="archive-loading" role="status" aria-label="正在加载文章归档">
          {[0, 1, 2].map((item) => (
            <Glass key={item} className="archive-month">
              <Skeleton width="30%" height={22} />
              <Skeleton width="18%" height={14} />
              <Skeleton width="82%" height={16} />
              <Skeleton width="68%" height={16} />
            </Glass>
          ))}
        </div>
      ) : error ? (
        <Glass>
          <EmptyState icon="alert" title="归档加载失败" desc={error} action={<Button variant="glass" onClick={reload}>重新加载</Button>} />
        </Glass>
      ) : !years.length ? (
        <Glass>
          <EmptyState icon="article" title="还没有已发布文章" desc="发布文章后，它们会按日期出现在这里。" />
        </Glass>
      ) : (
        <>
          <div className="archive-toolbar text-muted text-sm">共 {total} 篇文章，按发布时间从新到旧排列。点击年份或月份可收起列表。</div>
          <div className="archive-years">
            {years.map((year) => (
              <details className="archive-year" key={year.year} open>
                <summary className="archive-year__head">
                  <h2>{year.year} 年</h2>
                  <span>{year.count} 篇</span>
                  <Icon name="chevronDown" size={16} />
                </summary>
                <div className="archive-months">
                  {[...year.months.values()].map((month) => (
                    <details className="archive-month" key={month.key} open>
                      <summary className="archive-month__head">
                        <h3>{month.label}</h3>
                        <span>{month.count} 篇</span>
                        <Icon name="chevronDown" size={14} />
                      </summary>
                      <div className="archive-days">
                        {month.days.map((day) => (
                          <div className="archive-day" key={day.date}>
                            <time dateTime={day.date}>{formatDay(day.date)}</time>
                            <ul className="archive-day__articles">
                              {day.articles.map((article) => (
                                <li key={article.id}>
                                  <Link className="archive-article" to={`/articles/${article.id}`}>
                                    <span className="archive-article__title">{article.title}</span>
                                    <span className="archive-article__meta">
                                      {article.categoryName && <span className="archive-article__category">{article.categoryName}</span>}
                                      <time dateTime={article.publishedTime}>{article.publishedTime.slice(11, 16)}</time>
                                      <Icon name="arrowRight" size={13} />
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
