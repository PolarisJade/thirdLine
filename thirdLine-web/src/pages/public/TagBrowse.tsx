import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ArticleFeed from './ArticleFeed'
import { listTags } from '@/api/tag'

/** 按标签浏览文章 */
export default function TagBrowse() {
  const { id } = useParams<{ id: string }>()
  const tagId = Number(id)
  const [name, setName] = useState('标签')

  useEffect(() => {
    listTags()
      .then((list) => {
        const found = (list || []).find((t) => t.id === tagId)
        if (found) setName(found.name)
      })
      .catch(() => undefined)
  }, [tagId])

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-10 border-b border-line pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Tag</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tightest text-ink">#{name}</h1>
      </div>
      <ArticleFeed query={{ tagId }} size={9} emptyText="该标签下暂无已发布文章" />
    </div>
  )
}
