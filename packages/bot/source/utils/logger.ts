import 'colors';

export default {
  info: (message: string) => console.log(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`);
    if (error) console.error(error);
  },
  done: (message: string) => console.log(`[DONE] ${message}`),
  async: (message: string) => console.log(`[ASYNC] ${message}`),
};
