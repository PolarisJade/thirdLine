import { Link } from 'react-router-dom'
import type { ArticleVO } from '@/api'
import { Icon } from '@/components/Icon'
import { formatRelative, resolveSummary } from '@/utils/format'
import { articleCover, withFallback } from '@/utils/placeholder'

/**
 * 文章卡片（竖向：上图下字）。
 * 列表接口（/user/article/page）不返回正文，因此摘要优先取 summary 字段。
 * 首页宫格使用本组件；文章列表页 `/articles` 用下面的 ArticleRow。
 */
export function ArticleCard({ article, showStatus = false }: { article: ArticleVO; showStatus?: boolean }) {
  const summary = resolveSummary(article.summary, article.content)
  const isDraft = article.status === 0

  return (
    <Link to={`/articles/${article.id}`} className="glass glass--hoverable article-card">
      <div className="article-card__cover">
        <img src={withFallback(article.coverImage, articleCover(article.id))} alt={article.title} loading="lazy" />

        <div className="article-card__flags">
          {article.isTop === 1 && (
            <span className="article-card__flag article-card__flag--top">
              <Icon name="award" size={11} />
              置顶
            </span>
          )}
          {showStatus && isDraft && <span className="article-card__flag article-card__flag--draft">草稿</span>}
          {article.isOriginal === 1 && (
            <span className="article-card__flag">
              <Icon name="sparkles" size={11} />
              原创
            </span>
          )}
        </div>
      </div>

      <div className="article-card__body">
        <div className="article-card__meta">
          {article.categoryName && (
            <span className="article-card__meta-item">
              <Icon name="folder" size={13} />
              {article.categoryName}
            </span>
          )}
          <span className="article-card__meta-item">
            <Icon name="clock" size={13} />
            {formatRelative(article.publishedTime || article.createdTime)}
          </span>
        </div>

        <h3 className="article-card__title truncate-2">{article.title}</h3>

        <p className="article-card__summary truncate-2">{summary || '这篇文章还没有写摘要。'}</p>

        <div className="article-card__footer">
          <div className="tag-list">
            {(article.tags ?? []).slice(0, 3).map((tag) => (
              <span className="tag-chip" key={tag.id}>
                <Icon name="tag" size={11} />
                {tag.name}
              </span>
            ))}
            {(article.tags?.length ?? 0) > 3 && <span className="tag-chip">+{(article.tags?.length ?? 0) - 3}</span>}
          </div>

          <span className="article-card__meta-item" style={{ color: 'var(--brand-500)', fontWeight: 600 }}>
            阅读
            <Icon name="arrowRight" size={13} />
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * 文章列表项（横向一行）：左侧文字、右侧封面图。
 * 用于文章列表页 `/articles`，一个列表项占满一整行。
 */
export function ArticleRow({ article }: { article: ArticleVO }) {
  const summary = resolveSummary(article.summary, article.content, 200)

  return (
    <Link to={`/articles/${article.id}`} className="glass glass--hoverable article-row">
      <div className="article-row__main">
        <div className="article-card__meta">
          {article.categoryName && (
            <span className="article-card__meta-item">
              <Icon name="folder" size={13} />
              {article.categoryName}
            </span>
          )}
          <span className="article-card__meta-item">
            <Icon name="clock" size={13} />
            {formatRelative(article.publishedTime || article.createdTime)}
          </span>
          {article.isTop === 1 && (
            <span className="article-card__meta-item" style={{ color: 'var(--brand-500)' }}>
              <Icon name="award" size={13} />
              置顶
            </span>
          )}
        </div>

        <h3 className="article-card__title truncate-2">{article.title}</h3>

        <p className="article-card__summary truncate-2">{summary || '这篇文章还没有写摘要。'}</p>

        <div className="article-card__footer">
          <div className="tag-list">
            {(article.tags ?? []).slice(0, 4).map((tag) => (
              <span className="tag-chip" key={tag.id}>
                <Icon name="tag" size={11} />
                {tag.name}
              </span>
            ))}
            {(article.tags?.length ?? 0) > 4 && <span className="tag-chip">+{(article.tags?.length ?? 0) - 4}</span>}
          </div>

          <span className="article-card__meta-item" style={{ color: 'var(--brand-500)', fontWeight: 600 }}>
            阅读
            <Icon name="arrowRight" size={13} />
          </span>
        </div>
      </div>

      <div className="article-row__cover">
        <img src={withFallback(article.coverImage, articleCover(article.id))} alt={article.title} loading="lazy" />

        {article.isOriginal === 1 && (
          <div className="article-card__flags">
            <span className="article-card__flag">
              <Icon name="sparkles" size={11} />
              原创
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
