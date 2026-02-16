interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  readonly VITE_DISCORD_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
