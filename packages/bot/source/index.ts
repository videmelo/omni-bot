// By VideMelo: https://github.com/videmelo :p
import 'dotenv/config';

import Bot from './core/Bot.js';
import Logger from './utils/logger.js';
const client = new Bot();

process.on('uncaughtException', (err: unknown) => {
  if (
    err instanceof Error &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'ERR_STREAM_PREMATURE_CLOSE'
  )
    return;
  Logger.error(`Uncaught Exception:`, err);
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
client.login();

export default client;
