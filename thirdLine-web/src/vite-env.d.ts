/// <reference types="vite/client" />

/** 自定义环境变量（见 .env.development / .env.production） */
interface ImportMetaEnv {
  /** 后端接口基础路径，默认 /api（开发环境由 vite 代理转发到 thirdLine-api） */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
