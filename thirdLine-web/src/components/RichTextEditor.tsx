import { useEffect, useRef } from 'react'
import { message } from 'antd'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import { uploadImage } from '@/api/file'

interface RichTextEditorProps {
  /** 受控值：富文本 HTML（可与 AntD Form 联动） */
  value?: string
  onChange?: (html: string) => void
  /** 编辑区高度 */
  height?: number
}

/**
 * 富文本编辑器（wangEditor 封装）：
 * 正文以 HTML 存储，工具栏插图直接走后端 OSS 上传接口。
 */
export default function RichTextEditor({ value, onChange, height = 460 }: RichTextEditorProps) {
  const editorRef = useRef<IDomEditor | null>(null)

  useEffect(() => {
    return () => {
      editorRef.current?.destroy()
      editorRef.current = null
    }
  }, [])

  const toolbarConfig: Partial<IToolbarConfig> = {
    // 去掉个人博客用不到的视频、全屏
    excludeKeys: ['group-video', 'fullScreen'],
  }

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '开始写作…',
    MENU_CONF: {
      uploadImage: {
        // 自定义上传：复用后端 /user/file/upload（OSS），拿到 URL 后插入
        async customUpload(
          file: File,
          insertFn: (url: string, alt?: string, href?: string) => void,
        ) {
          if (!file.type.startsWith('image/')) {
            message.error('只能上传图片文件')
            return
          }
          if (file.size / 1024 / 1024 > 5) {
            message.error('图片不能超过 5MB')
            return
          }
          const hide = message.loading('图片上传中…', 0)
          try {
            const url = await uploadImage(file, 'content')
            insertFn(url, '', url)
            message.success('上传成功')
          } catch {
            // 错误提示已由响应拦截器统一处理
          } finally {
            hide()
          }
        },
      },
    },
  }

  return (
    <div className="relative" style={{ border: '1px solid #eaeaea', borderRadius: 8, zIndex: 100 }}>
      <Toolbar
        editor={editorRef.current}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #ececec' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        mode="default"
        style={{ height, overflowY: 'hidden' }}
        onCreated={(editor) => {
          editorRef.current = editor
        }}
        onChange={(editor) => onChange?.(editor.getHtml())}
      />
    </div>
  )
}
