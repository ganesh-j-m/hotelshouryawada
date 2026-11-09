/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin when the API is hosted separately, e.g. https://api.example.com (leave empty for same origin) */
  readonly VITE_API_URL?: string;
  /** Public website URL used for canonical links and structured data */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
