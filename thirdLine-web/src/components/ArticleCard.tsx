import { Link } from 'react-router-dom'
import { ArrowUpRightIcon } from '@phosphor-icons/react'
import type { ArticleVO } from '@/types'
import { formatDate } from '@/utils/format'
import Pill from './Pill'

interface ArticleCardProps {
  article: ArticleVO
}

/** 前台文章卡片：整行横向布局（左内容 + 右封面），1px 边框、低饱和封面、衬线标题；悬浮出阴影并显示左侧绿色竖线 */
export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="mui-card group relative flex flex-col overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:flex-row"
    >
      {/* 封面：仅在作者上传了封面时展示；桌面端排在右侧，移动端保持在顶部 */}
      {article.coverImage && (
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-bone sm:order-2 sm:aspect-auto sm:w-64 md:w-80">
          <img
            src={article.coverImage}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover opacity-90 saturate-[0.85] transition duration-500 group-hover:scale-[1.02] group-hover:opacity-100"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:order-1 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {article.isTop === 1 && (
            <span className="mui-pill" style={{ background: '#FBF3DB', color: '#956400' }}>
              置顶
            </span>
          )}
          {article.categoryName && (
            <Pill label={article.categoryName} seed={article.categoryId} />
          )}
          <span className="font-mono text-xs text-muted">
            {formatDate(article.publishedTime || article.createdTime)}
          </span>
        </div>

        <h3
          className="font-serif text-xl font-semibold tracking-tightest text-ink"
          style={{ lineHeight: 1.2 }}
        >
          {article.title}
        </h3>

        {article.summary && (
          <p className="line-clamp-1 text-muted">{article.summary}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {article.tags?.slice(0, 3).map((tag) => (
              <Pill key={tag.id} label={tag.name} seed={tag.id} />
            ))}
          </div>
          <span className="flex items-center gap-1 font-mono text-xs text-muted">
            {article.authorName || '匿名'}
            <ArrowUpRightIcon weight="bold" size={14} />
          </span>
        </div>
      </div>

      {/* 悬浮时出现的左侧绿色竖线 */}
      <span
        className="absolute left-0 top-0 h-full w-1 bg-green-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden="true"
      />
    </Link>
  )
}
