/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string
  // 可以在这里添加更多环境变量类型
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}