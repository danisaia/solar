/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // mais variáveis de ambiente podem ser adicionadas aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
