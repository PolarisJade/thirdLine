import { useMemo } from 'react'
import DOMPurify from 'dompurify'

interface RichTextViewProps {
  /** 富文本 HTML 内容 */
  content?: string | null
}

/** 前台文章正文渲染：安全地渲染富文本 HTML（经 DOMPurify 过滤） */
export default function RichTextView({ content }: RichTextViewProps) {
  const html = useMemo(
    () => DOMPurify.sanitize(content || '', { ADD_ATTR: ['target'] }),
    [content],
  )

  return (
    <div
      className="markdown-body rich-text"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
