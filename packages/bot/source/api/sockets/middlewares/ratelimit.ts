import { SocketData } from '../index.js';

type RequestName = string;

interface RequestData {
   count: number;
   startTime: number;
}

interface RequestsMap {
   [event: string]: RequestData;
}

interface RateLimitOptions {
   ignore?: RequestName[];
   max?: number;
   custom?: Record<RequestName, number>;
   time?: number;
   warns?: number;
}

export default function RateLimit(socket: SocketData, options: RateLimitOptions) {
   const { ignore = [], max = 20, custom = {}, time = 15000, warns = 10 } = options;

   const requests = new Map<string, RequestsMap>();

   return function (packet: any[], next: (err?: Error) => void) {
      const event = packet[0];

      if (ignore.includes(event)) return next();

      socket.warns = socket.warns ?? 0;
      if (socket.warns >= warns) {
         socket.emit('status', {
            type: 'error',
            message: `You have been blocked for a while, try again later.`,
         });
         return;
      }

      const now = Date.now();
      const cached = requests.get(socket.id) || {};
      const data = cached[event] || { count: 0, startTime: now };

      if (now - data.startTime > time) {
         data.count = 0;
         data.startTime = now;
      }

      data.count++;

      if (data.count > (custom[event] ?? max)) {
         socket.emit('status', {
            type: 'error',
            message: `You are making requests too quickly; please wait a moment before making the next one!`,
         });
         socket.warns = socket.warns + 1;
         return;
      }

      cached[event] = data;
      requests.set(socket.id, cached);

      next();
   };
}
