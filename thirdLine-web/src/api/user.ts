import { request } from './request'
import type {
  LoginDTO,
  LoginVO,
  PasswordUpdateDTO,
  RegisterDTO,
  UserUpdateDTO,
  UserVO,
} from '@/types'

/** 用户登录（账号支持用户名或注册邮箱） */
export const login = (data: LoginDTO) =>
  request.post<LoginVO>('/user/user/login', data)

/** 发送注册邮箱验证码 */
export const sendEmailCode = (email: string) =>
  request.post<void>(`/user/user/email/code?email=${encodeURIComponent(email)}`)

/** 邮箱验证码注册，成功后直接返回登录态 */
export const register = (data: RegisterDTO) =>
  request.post<LoginVO>('/user/user/register', data)

/** 修改当前登录用户信息（后台，需登录） */
export const updateInfo = (data: UserUpdateDTO) =>
  request.put<UserVO>('/admin/user/info', data)

/** 修改当前登录用户密码（后台，需登录） */
export const updatePassword = (data: PasswordUpdateDTO) =>
  request.put<void>('/admin/user/password', data)
