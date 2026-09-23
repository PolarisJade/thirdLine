import { useSearchParams } from 'react-router-dom'
import ArticleFeed from './ArticleFeed'

/** 关键词搜索页 */
export default function Search() {
  const [params] = useSearchParams()
  const keyword = params.get('keyword') || ''

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-10 border-b border-line pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Search</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tightest text-ink">
          {keyword ? `“${keyword}”` : '全部文章'}
        </h1>
      </div>
      <ArticleFeed query={{ keyword }} size={9} emptyText="没有找到匹配的文章" />
    </div>
  )
}
