import { request } from './request'
import type {
  LoginDTO,
  LoginVO,
  PasswordUpdateDTO,
  UserUpdateDTO,
  UserVO,
} from '@/types'

/** 用户登录 */
export const login = (data: LoginDTO) =>
  request.post<LoginVO>('/user/user/login', data)

/** 修改当前登录用户信息（后台，需登录） */
export const updateInfo = (data: UserUpdateDTO) =>
  request.put<UserVO>('/admin/user/info', data)

/** 修改当前登录用户密码（后台，需登录） */
export const updatePassword = (data: PasswordUpdateDTO) =>
  request.put<void>('/admin/user/password', data)
