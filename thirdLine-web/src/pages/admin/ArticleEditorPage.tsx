import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { articleApi, categoryApi, tagApi, type ArticleVO } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Field, Input, Select, SwitchRow, Textarea } from '@/components/Form'
import { ImageUpload } from '@/components/ImageUpload'
import { Loading } from '@/components/Feedback'
import { RichEditor } from '@/components/RichEditor'
import { cx, errorMessage, stripHtml } from '@/utils/format'

/**
 * 文章编辑页（新增 / 修改共用）。
 *
 * 正文使用 wangEditor 5 富文本编辑器，产出 HTML 字符串存入后端 content 字段；
 * 前端通过 dangerouslySetInnerHTML + .rich-text 样式渲染，与编辑器内所见基本一致。
 * 图片上传走 POST /admin/file/upload（module=cover 用于封面）。
 */
export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const articleId = id ? Number(id) : undefined

  const navigate = useNavigate()
  const toast = useToast()

  /* ------------------------------------------------------------ 表单状态 */
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [tagIds, setTagIds] = useState<number[]>([])
  const [isTop, setIsTop] = useState(false)
  const [isOriginal, setIsOriginal] = useState(true)

  const [submitting, setSubmitting] = useState<'draft' | 'publish' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  /** 编辑模式下，正文尚未回填前不要把初始空值写回表单 */
  const [loaded, setLoaded] = useState(!isEdit)

  const categories = useAsync(() => categoryApi.adminList(), [])
  const tags = useAsync(() => tagApi.adminList(), [])

  /* --------------------------------------------------------- 回填文章数据 */
  useEffect(() => {
    if (!articleId) return

    let cancelled = false
    articleApi
      .adminDetail(articleId)
      .then((article: ArticleVO) => {
        if (cancelled) return
        setTitle(article.title ?? '')
        setContent(article.content ?? '')
        setSummary(article.summary ?? '')
        setCoverImage(article.coverImage ?? '')
        setCategoryId(article.categoryId ?? '')
        setTagIds((article.tags ?? []).map((tag) => tag.id))
        setIsTop(article.isTop === 1)
        setIsOriginal(article.isOriginal !== 0)
        setLoaded(true)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(errorMessage(error))
          navigate('/admin/articles', { replace: true })
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  /** 正文字数统计，用于显示写作进度 */
  const contentStats = useMemo(() => {
    const plain = stripHtml(content)
    return { chars: plain.replace(/\s/g, '').length }
  }, [content])

  const toggleTag = (tagId: number) => {
    setTagIds((prev) => (prev.includes(tagId) ? prev.filter((item) => item !== tagId) : [...prev, tagId]))
  }

  /** 保存：draft -> status 0，publish -> status 1 */
  const save = useCallback(
    async (mode: 'draft' | 'publish') => {
      const nextErrors: Record<string, string> = {}
      if (!title.trim()) nextErrors.title = '文章标题不能为空'
      if (!categoryId) nextErrors.categoryId = '请选择文章所属分类'

      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) {
        toast.warning(Object.values(nextErrors)[0])
        return
      }

      setSubmitting(mode)

      // 摘要留空时，用正文前 120 字自动生成，方便列表展示
      const finalSummary = summary.trim() || stripHtml(content).slice(0, 120)

      try {
        if (isEdit && articleId) {
          await articleApi.update({
            id: articleId,
            title: title.trim(),
            content,
            summary: finalSummary,
            coverImage,
            categoryId: Number(categoryId),
            isTop: isTop ? 1 : 0,
            isOriginal: isOriginal ? 1 : 0,
            status: mode === 'publish' ? 1 : 0,
            // 传空数组会清空原有标签关联
            tagIds,
          })
          toast.success(mode === 'publish' ? '文章已更新并发布' : '草稿已保存')
        } else {
          const newId = await articleApi.save({
            title: title.trim(),
            content,
            summary: finalSummary,
            coverImage,
            categoryId: Number(categoryId),
            isTop: isTop ? 1 : 0,
            isOriginal: isOriginal ? 1 : 0,
            status: mode === 'publish' ? 1 : 0,
            tagIds,
          })
          toast.success(mode === 'publish' ? '文章已发布' : '草稿已保存')
          // 保存后切到编辑模式，避免重复新增
          navigate(`/admin/articles/${newId}/edit`, { replace: true })
          return
        }

        navigate('/admin/articles')
      } catch (error) {
        toast.error(errorMessage(error))
      } finally {
        setSubmitting(null)
      }
    },
    [
      title,
      categoryId,
      summary,
      content,
      isEdit,
      articleId,
      coverImage,
      isTop,
      isOriginal,
      tagIds,
      toast,
      navigate,
    ],
  )

  if (isEdit && !loaded) {
    return <Loading text="正在读取文章内容…" />
  }

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="admin-page-head">
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <Button variant="ghost" iconOnly icon="chevronLeft" onClick={() => navigate('/admin/articles')} aria-label="返回" />
          <div>
            <h1 className="admin-page-head__title">{isEdit ? '编辑文章' : '写新文章'}</h1>
            <p className="admin-page-head__desc">
              {contentStats.chars} 字 · 正文支持富文本，图片会自动上传到 OSS
            </p>
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Button
            variant="glass"
            icon="file"
            loading={submitting === 'draft'}
            disabled={submitting !== null}
            onClick={() => void save('draft')}
          >
            存为草稿
          </Button>
          <Button
            variant="primary"
            icon="check"
            loading={submitting === 'publish'}
            disabled={submitting !== null}
            onClick={() => void save('publish')}
          >
            {isEdit ? '保存并发布' : '发布文章'}
          </Button>
        </div>
      </div>

      <div className="editor-layout">
        {/* ------------------------------------------------------ 主编辑区 */}
        <div className="stack" style={{ gap: 'var(--space-4)', minWidth: 0 }}>
          <Glass className="panel" variant="strong" style={{ padding: 'var(--space-5)' }}>
            <Field label="文章标题" required error={errors.title}>
              <Input
                placeholder="给这篇文章起个标题…"
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                style={{ fontSize: 17, fontWeight: 600, height: 48 }}
              />
            </Field>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <Field
                label="文章摘要"
                hint="留空时会自动截取正文前 120 字，用于列表页与搜索结果展示"
              >
                <Textarea
                  placeholder="用一两句话概括这篇文章…"
                  value={summary}
                  maxLength={300}
                  showCount
                  rows={3}
                  onChange={(event) => setSummary(event.target.value)}
                />
              </Field>
            </div>
          </Glass>

          <Glass className="panel" variant="strong" style={{ padding: 'var(--space-5)' }}>
            <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
              <span className="field__label field__label--required">正文</span>
              <span className="grow" />
              <span className="field__hint">支持标题、列表、引用、代码块、表格与图片</span>
            </div>

            <RichEditor value={content} onChange={setContent} placeholder="开始写点什么吧…" />
          </Glass>
        </div>

        {/* -------------------------------------------------------- 侧边栏 */}
        <aside className="editor-side">
          <Glass className="editor-side__card" variant="strong">
            <span className="editor-side__title">发布设置</span>

            <Field label="所属分类" required error={errors.categoryId}>
              <Select
                value={categoryId}
                placeholder={categories.loading ? '分类加载中…' : '请选择分类'}
                options={(categories.data ?? []).map((item) => ({ label: item.name, value: item.id }))}
                onChange={(event) => setCategoryId(event.target.value === '' ? '' : Number(event.target.value))}
              />
            </Field>

            {(categories.data?.length ?? 0) === 0 && !categories.loading && (
              <p className="field__hint" style={{ color: 'var(--warning)' }}>
                还没有分类，请先到「分类管理」创建。
              </p>
            )}

            <div>
              <span className="field__label">文章标签</span>
              <div className="tag-picker" style={{ marginTop: 8 }}>
                {tags.loading ? (
                  <span className="tag-picker__empty">标签加载中…</span>
                ) : (tags.data?.length ?? 0) === 0 ? (
                  <span className="tag-picker__empty">暂无标签，可在「标签管理」中创建</span>
                ) : (
                  tags.data?.map((tag) => (
                    <button
                      type="button"
                      key={tag.id}
                      className={cx('tag-chip', tagIds.includes(tag.id) && 'tag-chip--active')}
                      onClick={() => toggleTag(tag.id)}
                    >
                      <Icon name={tagIds.includes(tag.id) ? 'check' : 'tag'} size={12} />
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
              {tagIds.length > 0 && (
                <span className="field__hint" style={{ display: 'block', marginTop: 6 }}>
                  已选 {tagIds.length} 个标签
                </span>
              )}
            </div>

            <div className="divider" style={{ height: 1, background: 'var(--line)' }} />

            <SwitchRow
              label="置顶文章"
              desc="置顶后会排在文章列表前面"
              checked={isTop}
              onChange={setIsTop}
            />

            <SwitchRow
              label="标记为原创"
              desc="关闭则表示转载"
              checked={isOriginal}
              onChange={setIsOriginal}
            />
          </Glass>

          <Glass className="editor-side__card" variant="strong">
            <span className="editor-side__title">封面图</span>
            <ImageUpload
              value={coverImage}
              module="cover"
              aspect="16 / 9"
              hint="建议 16:9，宽度 800px 以上更清晰"
              onChange={setCoverImage}
            />
          </Glass>

          <Glass className="editor-side__card" variant="strong">
            <span className="editor-side__title">写作提示</span>
            <div className="stack text-sm text-muted" style={{ gap: 8, lineHeight: 1.75 }}>
              <span className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <Icon name="info" size={15} style={{ marginTop: 3 }} />
                标题写清楚「解决了什么问题」，比写「某某技术详解」更有点击欲。
              </span>
              <span className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <Icon name="code" size={15} style={{ marginTop: 3 }} />
                代码块建议标注语言，前台渲染时更容易阅读。
              </span>
              <span className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <Icon name="award" size={15} style={{ marginTop: 3 }} />
                先存草稿再发布，可以避免写一半被打断。
              </span>
            </div>
          </Glass>
        </aside>
      </div>
    </div>
  )
}
