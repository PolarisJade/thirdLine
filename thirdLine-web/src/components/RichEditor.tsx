import { useCallback, useEffect, useMemo, useState } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import { fileApi } from '@/api'
import { useToast } from './ToastContext'
import { errorMessage } from '@/utils/format'

export interface RichEditorProps {
  /** HTML 字符串，与后端 Article.content 字段一致 */
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** 编辑区最小高度 */
  minHeight?: number
  /** 是否只读 */
  readOnly?: boolean
}

/**
 * 富文本编辑器封装（wangEditor 5）。
 *
 * 设计要点：
 *  - 产出 / 接收的都是 HTML 字符串，直接对应后端 ArticleSaveDTO.content，无需额外转换；
 *  - 图片、视频、附件上传统一接管为 POST /admin/file/upload，上传后插入 OSS 返回的 URL；
 *    本地上传失败时会提示，避免静默丢失。
 *  - 支持粘贴图片自动上传（base64LimitSize 设为 0，不保留 base64，统一走 OSS）。
 */
export function RichEditor({ value, onChange, placeholder = '请输入内容…', minHeight = 460, readOnly = false }: RichEditorProps) {
  const toast = useToast()
  const [editor, setEditor] = useState<IDomEditor | null>(null)

  /** 组件卸载时必须销毁编辑器实例，否则会残留 DOM 与事件监听 */
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy()
      }
    }
  }, [editor])

  /**
   * 自定义上传。
   * wangEditor 的回调签名：insertFn(url, alt, href)
   */
  const handleUpload = useCallback(
    (file: File, insertFn: (url: string, alt?: string, href?: string) => void) => {
      const isImage = file.type.startsWith('image/')

      const task = isImage ? fileApi.uploadImage(file, 'common') : fileApi.uploadAudio(file, 'common')

      task
        .then((url) => {
          insertFn(url, file.name, url)
          toast.success(`${isImage ? '图片' : '文件'}上传成功`)
        })
        .catch((error: unknown) => {
          toast.error(`上传失败：${errorMessage(error)}`)
        })
    },
    [toast],
  )

  /** 编辑器配置：关闭 base64 粘贴，统一走 OSS */
  const editorConfig = useMemo<Partial<IEditorConfig>>(
    () => ({
      placeholder,
      readOnly,
      // 设为 0 表示任何图片都不使用 base64，全部走自定义上传
      MENU_CONF: {
        uploadImage: {
          customUpload: handleUpload,
        },
        uploadVideo: {
          customUpload: handleUpload,
        },
        // 允许粘贴的图片自动上传（默认即 true）
        pasteImage: {
          customUpload: handleUpload,
        },
      },
    }),
    [placeholder, readOnly, handleUpload],
  )

  /** 工具栏配置：按博客写作场景精简，去掉用不到的多媒体菜单 */
  const toolbarConfig = useMemo<Partial<IToolbarConfig>>(
    () => ({
      excludeKeys: ['group-video', 'insertVideo', 'uploadVideo', 'fullScreen', 'emotion'],
    }),
    [],
  )

  return (
    <div className="editor-shell">
      {!readOnly && (
        <Toolbar
          editor={editor}
          defaultConfig={toolbarConfig}
          mode="default"
          style={{ borderBottom: '1px solid var(--line)' }}
        />
      )}

      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        onChange={(instance) => onChange(instance.getHtml())}
        mode="default"
        style={{ minHeight, overflowY: 'hidden' }}
      />
    </div>
  )
}
