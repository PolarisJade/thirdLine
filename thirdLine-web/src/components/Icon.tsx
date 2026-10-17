import type { CSSProperties } from 'react'

/**
 * 内联 SVG 图标集（线性风格，统一 1.75 描边）。
 * 不引第三方图标库，避免为几十个图标增加打包体积。
 */

export type IconName =
  | 'home'
  | 'article'
  | 'grid'
  | 'image'
  | 'music'
  | 'message'
  | 'user'
  | 'users'
  | 'settings'
  | 'dashboard'
  | 'search'
  | 'close'
  | 'menu'
  | 'edit'
  | 'trash'
  | 'plus'
  | 'upload'
  | 'download'
  | 'external'
  | 'github'
  | 'mail'
  | 'calendar'
  | 'clock'
  | 'tag'
  | 'folder'
  | 'eye'
  | 'eyeOff'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'chevronUp'
  | 'arrowRight'
  | 'arrowUp'
  | 'logout'
  | 'sun'
  | 'moon'
  | 'play'
  | 'pause'
  | 'skipBack'
  | 'skipForward'
  | 'volume'
  | 'volumeMute'
  | 'list'
  | 'flag'
  | 'check'
  | 'alert'
  | 'info'
  | 'sparkles'
  | 'heart'
  | 'code'
  | 'link'
  | 'file'
  | 'copy'
  | 'refresh'
  | 'filter'
  | 'quote'
  | 'send'
  | 'zap'
  | 'award'
  | 'book'
  | 'lock'

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5',
  article: 'M4 4v16h16V8l-4-4H4Zm12 0v4h4M8 12h8M8 16h5',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  image: 'M3 5h18v14H3V5Zm0 10 5-5 4 4 3-3 6 6M9.5 9.5h.01',
  music: 'M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  message: 'M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 0 1 8-8h2a8 8 0 0 1 8 4Z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm11.5 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  settings:
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.6a7.7 7.7 0 0 0 0-1.8l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-1.6-.9L15 4h-4l-.5 2.3a7.6 7.6 0 0 0-1.6.9l-2.3-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 1.8l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 1.6.9L11 20h4l.5-2.3a7.6 7.6 0 0 0 1.6-.9l2.3 1 2-3.4-2-1.5Z',
  dashboard: 'M4 13h7v7H4v-7Zm9-9h7v7h-7V4ZM4 4h7v6H4V4Zm9 9h7v7h-7v-7Z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  close: 'M18 6 6 18M6 6l12 12',
  menu: 'M3 6h18M3 12h18M3 18h18',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  trash: 'M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5M14 11v5',
  plus: 'M12 5v14M5 12h14',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v13',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
  github:
    'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 4.94-2.22 4.94-6.15a4.65 4.65 0 0 0-1.24-3.22 4.37 4.37 0 0 0-.09-3.18s-1.16-.37-3.8 1.42a9.5 9.5 0 0 0-5 0C6.47 1.6 5.31 1.97 5.31 1.97a4.37 4.37 0 0 0-.09 3.18A4.65 4.65 0 0 0 4 8.37c0 3.9 1.8 5.77 4.94 6.15a3.37 3.37 0 0 0-.94 2.58V22',
  mail: 'M3 6h18v12H3V6Zm0 0 9 7 9-7',
  calendar: 'M3 6h18v15H3V6Zm0 5h18M8 3v4M16 3v4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2',
  tag: 'M20.6 13.4 12 22l-9-9V4h9l8.6 8.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M17.9 17.9A10.1 10.1 0 0 1 12 19c-6.4 0-10-7-10-7a17.6 17.6 0 0 1 4.2-5.1M9.9 4.2A10.6 10.6 0 0 1 12 4c6.4 0 10 7 10 7a17.7 17.7 0 0 1-2.2 3.2M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20',
  chevronLeft: 'm15 18-6-6 6-6',
  chevronRight: 'm9 18 6-6-6-6',
  chevronDown: 'm6 9 6 6 6-6',
  chevronUp: 'm18 15-6-6-6 6',
  arrowRight: 'M5 12h14m-6-6 6 6-6 6',
  arrowUp: 'M12 19V5m-6 6 6-6 6 6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-14v2m0 18v-2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  play: 'M6 4.5v15l13-7.5-13-7.5Z',
  pause: 'M8 4h3v16H8V4Zm5 0h3v16h-3V4Z',
  skipBack: 'M19 20 9 12l10-8v16ZM5 4v16',
  skipForward: 'M5 4l10 8-10 8V4Zm14 0v16',
  volume: 'M11 5 6 9H3v6h3l5 4V5Zm5.5 3.5a5 5 0 0 1 0 7m3-9.5a9 9 0 0 1 0 12',
  volumeMute: 'M11 5 6 9H3v6h3l5 4V5Zm6 4 4 4m0-4-4 4',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  flag: 'M4 22V4h9l1 2h6v9h-7l-1-2H4',
  check: 'm4 12 5 5L20 6',
  alert: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13h.01M11 12h1v5h1',
  sparkles:
    'm12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Zm7 10 .9 2.1L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-.9L19 13Z',
  heart: 'M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z',
  code: 'm16 18 6-6-6-6M8 6l-6 6 6 6',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6',
  copy: 'M8 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Zm8-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2',
  refresh: 'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5',
  filter: 'M3 5h18l-7 8v6l-4 2v-8L3 5Z',
  quote: 'M7 7h4v6a4 4 0 0 1-4 4H6M15 7h4v6a4 4 0 0 1-4 4h-1',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-3.5-1L7 22l5-3 5 3-1.5-8',
  book: 'M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4V4Zm16 0h-4a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20V4Z',
  lock: 'M5 11h14v10H5V11Zm2 0V7a5 5 0 0 1 10 0v4M12 15v3',
}

export interface IconProps {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  style?: CSSProperties
  filled?: boolean
}

export function Icon({ name, size = 18, strokeWidth = 1.75, className, style, filled = false }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
