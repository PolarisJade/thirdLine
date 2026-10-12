import { Link } from 'react-router-dom'
import type { PortfolioVO } from '@/api'
import { Icon } from '@/components/Icon'
import { formatDate } from '@/utils/format'
import { portfolioCover, withFallback } from '@/utils/placeholder'

/** 作品卡片：技术栈、担任角色、周期、演示/仓库链接 */
export function WorkCard({ work }: { work: PortfolioVO }) {
  const stack = work.techStacks ?? []

  return (
    <article className="glass glass--hoverable work-card">
      <div className="work-card__cover">
        <img
          src={withFallback(work.coverImage, portfolioCover(work.id))}
          alt={work.title}
          loading="lazy"
        />
      </div>

      <div className="work-card__body">
        <h3 className="work-card__title truncate-2">{work.title}</h3>
        <p className="work-card__summary truncate-3">{work.summary || '这个作品还没有写简介。'}</p>

        <div className="work-card__facts">
          {work.role && (
            <span className="work-card__fact">
              <Icon name="user" size={14} />
              <span className="work-card__fact-label">角色</span>
              {work.role}
            </span>
          )}
          {work.period && (
            <span className="work-card__fact">
              <Icon name="calendar" size={14} />
              <span className="work-card__fact-label">周期</span>
              {work.period}
            </span>
          )}
          {!work.role && !work.period && (
            <span className="work-card__fact">
              <Icon name="calendar" size={14} />
              <span className="work-card__fact-label">发布</span>
              {formatDate(work.publishTime || work.createTime)}
            </span>
          )}
        </div>

        {stack.length > 0 && (
          <div className="tag-list">
            {stack.slice(0, 5).map((tech) => (
              <span className="tag-chip" key={tech.id}>
                <Icon name="code" size={11} />
                {tech.name}
              </span>
            ))}
            {stack.length > 5 && <span className="tag-chip">+{stack.length - 5}</span>}
          </div>
        )}

        {(work.demoUrl || work.repoUrl) && (
          <div className="work-card__links">
            {work.demoUrl && (
              <a
                className="work-link"
                href={work.demoUrl}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(event) => event.stopPropagation()}
              >
                <Icon name="external" size={14} />
                在线演示
              </a>
            )}
            {work.repoUrl && (
              <a
                className="work-link"
                href={work.repoUrl}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(event) => event.stopPropagation()}
              >
                <Icon name="github" size={14} />
                源代码
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

/** 首页的最新作品小卡：横向紧凑排版 */
export function WorkMiniCard({ work }: { work: PortfolioVO }) {
  return (
    <Link to="/portfolio" className="glass glass--hoverable" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ aspectRatio: '16 / 9', overflow: 'hidden' }}>
        <img
          src={withFallback(work.coverImage, portfolioCover(work.id))}
          alt={work.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div className="stack" style={{ gap: 6, padding: 'var(--space-4)' }}>
        <span style={{ fontSize: 14.5, fontWeight: 700 }} className="truncate-1">
          {work.title}
        </span>
        <span className="text-xs text-muted truncate-1">{work.role || work.techStacks?.[0]?.name || '作品'}</span>
      </div>
    </Link>
  )
}
