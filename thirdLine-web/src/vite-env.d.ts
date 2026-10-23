/// <reference types="vite/client" />

/** 自定义环境变量（见 .env.development / .env.production） */
interface ImportMetaEnv {
  /** 后端接口基础路径，默认 /api（开发环境由 vite 代理转发到 thirdLine-api） */
  readonly VITE_API_BASE?: string
  /** ICP 个人备案号（本地 .env.local 注入，不入库） */
  readonly VITE_ICP_NUMBER?: string
  /** 公安联网备案号（本地 .env.local 注入，不入库） */
  readonly VITE_POLICE_BEIAN_NUMBER?: string
  /** 公安联网备案编号 code，用于拼接查询链接（本地 .env.local 注入，不入库） */
  readonly VITE_POLICE_BEIAN_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
