import { useRef, useState, type DragEvent } from 'react'
import { fileApi } from '@/api'
import { useToast } from './ToastContext'
import { Icon } from './Icon'
import { errorMessage, cx } from '@/utils/format'

export interface ImageUploadProps {
  value: string | null | undefined
  onChange: (url: string) => void
  /**
   * 业务模块目录，对应后端 /admin/file/upload 的 module 参数
   * （avatar 头像 / cover 文章封面 / photo 相册 / portfolio 作品 / music 音乐封面 / common 其它）
   */
  module?: string
  /** 上传成功后可回传图片原始尺寸，用于照片的 width/height 字段 */
  onUploaded?: (url: string, meta: { width: number; height: number; size: number }) => void
  aspect?: string
  hint?: string
}

/**
 * 图片上传组件。
 * 走 POST /admin/file/upload（multipart/form-data，字段 file + module），
 * 返回 OSS 可访问 URL。也支持直接粘贴外链（后端 coverImage 等字段接受任意 URL）。
 */
export function ImageUpload({ value, onChange, module = 'common', onUploaded, aspect, hint }: ImageUploadProps) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片不能超过 10MB')
      return
    }

    setUploading(true)
    setProgress(15)

    try {
      // axios 上传进度回调较重，这里用定时器模拟平滑进度，上传失败会立即收尾
      const timer = window.setInterval(() => setProgress((prev) => Math.min(prev + 12, 88)), 180)
      const url = await fileApi.uploadImage(file, module)
      window.clearInterval(timer)
      setProgress(100)

      onChange(url)

      if (onUploaded) {
        // 读取原始尺寸，供照片的 width / height 字段使用
        const image = new Image()
        image.onload = () => onUploaded(url, { width: image.naturalWidth, height: image.naturalHeight, size: file.size })
        image.onerror = () => onUploaded(url, { width: 0, height: 0, size: file.size })
        image.src = url
      }

      toast.success('图片上传成功')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setUploading(false)
      window.setTimeout(() => setProgress(0), 400)
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void upload(file)
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div
        className={cx('upload-box', dragging && 'upload-box--dragging', value && 'upload-box--filled')}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
      >
        {value ? (
          <>
            <img
              className="upload-box__preview"
              src={value}
              alt="已上传图片"
              style={aspect ? { aspectRatio: aspect, objectFit: 'cover' } : undefined}
            />
            <button
              type="button"
              className="upload-box__remove"
              onClick={(event) => {
                event.stopPropagation()
                onChange('')
              }}
              aria-label="移除图片"
            >
              <Icon name="close" size={14} strokeWidth={2.4} />
            </button>
          </>
        ) : uploading ? (
          <>
            <div className="spinner" />
            <span>正在上传…{progress}%</span>
          </>
        ) : (
          <>
            <Icon name="upload" size={24} />
            <span style={{ fontWeight: 600 }}>点击或拖拽图片到此处上传</span>
            <span style={{ fontSize: 12 }}>{hint ?? '支持 jpg / png / webp / gif，单张不超过 10MB'}</span>
          </>
        )}

        {uploading && (
          <div className="upload-progress">
            <div className="upload-progress__bar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* 也允许手填外链，兼容已有的第三方图片地址 */}
      <input
        className="input"
        style={{ height: 36, fontSize: 13 }}
        value={value ?? ''}
        placeholder="也可以直接粘贴图片外链"
        onChange={(event) => onChange(event.target.value)}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
          // 重置以便同一文件可重复选择
          event.target.value = ''
        }}
      />
    </div>
  )
}

export interface AudioUploadProps {
  value: string | null | undefined
  onChange: (url: string) => void
}

/** 音频上传，走 POST /admin/file/upload-audio，用于音乐模块 */
export function AudioUpload({ value, onChange }: AudioUploadProps) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const url = await fileApi.uploadAudio(file, 'music')
      onChange(url)
      toast.success('音频上传成功')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 10 }}>
        <button
          type="button"
          className="btn btn--glass btn--sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <span className="btn__spinner" /> : <Icon name="upload" size={15} />}
          {uploading ? '上传中…' : '上传音频'}
        </button>
        {value && (
          <span className="text-xs text-muted truncate-1" style={{ maxWidth: 240 }}>
            {value.split('/').pop()}
          </span>
        )}
      </div>

      <input
        className="input"
        style={{ height: 36, fontSize: 13 }}
        value={value ?? ''}
        placeholder="音频文件 URL（也可直接填第三方外链）"
        onChange={(event) => onChange(event.target.value)}
      />

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}
