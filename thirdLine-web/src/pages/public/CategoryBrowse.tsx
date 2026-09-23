import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ArticleFeed from './ArticleFeed'
import { listCategories } from '@/api/category'

/** 按分类浏览文章 */
export default function CategoryBrowse() {
  const { id } = useParams<{ id: string }>()
  const categoryId = Number(id)
  const [name, setName] = useState('分类')

  useEffect(() => {
    listCategories()
      .then((list) => {
        const found = (list || []).find((c) => c.id === categoryId)
        if (found) setName(found.name)
      })
      .catch(() => undefined)
  }, [categoryId])

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-10 border-b border-line pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Category</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tightest text-ink">{name}</h1>
      </div>
      <ArticleFeed query={{ categoryId }} size={9} emptyText="该分类下暂无已发布文章" />
    </div>
  )
}
