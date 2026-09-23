import { useState } from 'react'
import { Upload, message } from 'antd'
import { Plus, SpinnerGap } from '@phosphor-icons/react'
import { uploadImage } from '@/api/file'

interface UploadImageProps {
  /** 受控值：已上传的图片 URL（可与 AntD Form 联动） */
  value?: string
  onChange?: (url: string) => void
  /** OSS 业务目录，如 avatar / cover */
  module?: string
  /** 预览尺寸 */
  width?: number
  height?: number
}

/** 图片上传组件：调用后端 OSS 上传接口，成功后回填 URL */
export default function UploadImage({
  value,
  onChange,
  module = 'common',
  width = 120,
  height = 120,
}: UploadImageProps) {
  const [loading, setLoading] = useState(false)

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件')
      return Upload.LIST_IGNORE
    }
    const under5M = file.size / 1024 / 1024 < 5
    if (!under5M) {
      message.error('图片不能超过 5MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  const customRequest = async (options: { file: unknown }) => {
    const file = options.file as File
    setLoading(true)
    try {
      const url = await uploadImage(file, module)
      onChange?.(url)
      message.success('上传成功')
    } catch {
      // 错误提示已由响应拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <Upload
      accept="image/*"
      showUploadList={false}
      beforeUpload={beforeUpload}
      customRequest={customRequest as never}
    >
      <div
        className="flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-line bg-surface transition hover:border-charcoal"
        style={{ width, height, borderRadius: 8 }}
      >
        {value ? (
          <img
            src={value}
            alt="preview"
            className="h-full w-full object-cover"
          />
        ) : loading ? (
          <SpinnerGap size={20} className="animate-spin text-muted" />
        ) : (
          <Plus size={20} className="text-muted" />
        )}
      </div>
    </Upload>
  )
}
