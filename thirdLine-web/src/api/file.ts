import { request } from './request'

/** 上传图片到阿里云 OSS，返回可访问 URL（后台，需登录）。module 如 avatar / cover */
export const uploadImage = (file: File, module = 'common') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('module', module)
  return request.post<string>('/admin/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** 上传音频到阿里云 OSS，返回可访问 URL（后台，需登录）。module 如 music */
export const uploadAudio = (file: File, module = 'common') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('module', module)
  return request.post<string>('/admin/file/upload-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
