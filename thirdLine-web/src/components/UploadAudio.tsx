import { useState } from 'react'
import { Button, Input, Upload, message } from 'antd'
import { MusicNotes, SpinnerGap, UploadSimple } from '@phosphor-icons/react'
import { uploadAudio } from '@/api/file'

interface UploadAudioProps {
  /** 受控值：音频 URL（可与 AntD Form 联动） */
  value?: string
  onChange?: (url: string) => void
  /** OSS 业务目录，如 music */
  module?: string
}

/** 音频录入组件：支持直接粘贴外链 URL，或上传本地音频文件到 OSS 后自动回填 URL */
export default function UploadAudio({ value, onChange, module = 'music' }: UploadAudioProps) {
  const [loading, setLoading] = useState(false)

  const beforeUpload = (file: File) => {
    // 部分格式（如 flac）浏览器可能拿不到 audio/* 的 MIME，兜底按扩展名判断
    const isAudio =
      file.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(file.name)
    if (!isAudio) {
      message.error('只能上传音频文件（mp3 / wav / flac / m4a / aac / ogg）')
      return Upload.LIST_IGNORE
    }
    const under50M = file.size / 1024 / 1024 < 50
    if (!under50M) {
      message.error('音频不能超过 50MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  const customRequest = async (options: { file: unknown }) => {
    const file = options.file as File
    setLoading(true)
    try {
      const url = await uploadAudio(file, module)
      onChange?.(url)
      message.success('上传成功')
    } catch {
      // 错误提示已由响应拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="粘贴音频外链，或点击右侧上传本地文件"
        prefix={<MusicNotes size={16} className="text-muted" />}
        allowClear
      />
      <Upload
        accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg"
        showUploadList={false}
        beforeUpload={beforeUpload}
        customRequest={customRequest as never}
      >
        <Button
          icon={loading ? <SpinnerGap size={16} className="animate-spin" /> : <UploadSimple size={16} />}
          disabled={loading}
        >
          {loading ? '上传中' : '上传音频'}
        </Button>
      </Upload>
    </div>
  )
}
