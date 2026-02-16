import ytsr from 'youtube-sr';
import { Track } from '../index.js';
import type { TrackMetadataData } from '@omni/shared';
import Logger from '../../../utils/logger.js';
import fs from 'node:fs';
import { Stream } from 'node:stream';
import youtubeDl from 'youtube-dl-exec';

export class YouTube {
  urls: {
    pattern: RegExp;
    playlist: RegExp;
    video: RegExp;
  };

  private concurrencyLimit = 15;
  private activeCount = 0;
  private queue: (() => void)[] = [];
  private cookies?: string;

  constructor(options: { cookies?: string } = {}) {
    this.cookies = options.cookies;
    if (this.cookies && fs.existsSync(this.cookies)) {
      Logger.info(`YouTube: Cookies file found at ${this.cookies}`);
    } else if (this.cookies) {
      Logger.warn(`YouTube: Cookies file not found at ${this.cookies}`);
    }
    this.urls = {
      pattern:
        /((?:https?:)?\/\/)?((?:www|m|music)\.)((?:youtube\.com|youtu\.be))\/(watch\?v=(.+)&list=|(playlist)\?list=|watch\?v=)?([^&]+)/,
      playlist:
        /^((?:https?:)?\/\/)?((?:www|m|music)\.)((?:youtube\.com|youtu.be)?)\/((((watch\?v=)?(.+)(&|\?))?list=|(playlist)\?list=)([^&]+))/,
      video:
        /^((?:https?:)?\/\/)?((?:www|m|music)\.)((?:youtube\.com|youtu.be)?)(\/((watch\?v=|embed\/|v\/))?)([\w-]+)/,
    };
  }

  async search(query: string): Promise<TrackMetadataData> {
    Logger.info(`Searching YouTube for: ${query}`);
    const result = (await ytsr.YouTube.search(query, { limit: 1, type: 'video' }))[0];
    return this.build(result);
  }

  getVideo(track: Track): Track | undefined {
    if (!track) return;
    if (track.metadata?.name.match(/\b(video|visualiz|official)\b\)/i)) return track;
    else return;
  }

  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        this.activeCount++;
        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.activeCount--;
            if (this.queue.length > 0) {
              const next = this.queue.shift();
              if (next) next();
            }
          });
      };

      if (this.activeCount < this.concurrencyLimit) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }

  private getYtDlpFlags(): Record<string, unknown> {
    const flags: Record<string, unknown> = {
      format: 'bestaudio[acodec=opus]/bestaudio',
      output: '-',
      quiet: true,
      noWarnings: true,
      noCheckCertificates: true,
      noPlaylist: true,
      jsRuntimes: `node:${process.execPath}`,
    };

    if (this.cookies && fs.existsSync(this.cookies)) {
      flags.cookies = this.cookies;
    }

    return flags;
  }

  public getAudioStream(url: string): Promise<NodeJS.ReadableStream> {
    return this.enqueue(() => {
      try {
        Logger.info(`Attempting to stream YouTube audio via yt-dlp: ${url}`);

        const flags = this.getYtDlpFlags();
        const subprocess = youtubeDl.exec(url, flags);

        // Catch the tinyspawn promise rejection to prevent unhandled rejections
        // Errors are handled via the event listeners below
        (subprocess as unknown as Promise<unknown>).catch(() => { });

        const stdout = subprocess.stdout;

        if (!stdout) {
          throw new Error('yt-dlp: Failed to get stdout stream');
        }

        const passthrough = new Stream.PassThrough();

        subprocess.stderr?.on('data', (data: Buffer) => {
          const msg = data.toString().trim();
          if (msg) Logger.warn(`yt-dlp stderr: ${msg}`);
        });

        stdout.pipe(passthrough);

        void subprocess.on('error', (err: Error) => {
          Logger.error('yt-dlp process error:', err.message);
          if (!passthrough.destroyed) passthrough.destroy(err);
        });

        void subprocess.on('close', (code: number | null) => {
          if (code !== 0 && code !== null) {
            Logger.error(`yt-dlp process exited with code ${code}`);
            if (!passthrough.destroyed) {
              passthrough.destroy(new Error(`yt-dlp exited with code ${code}`));
            }
          }
        });

        Logger.info('YouTube: Stream created successfully with yt-dlp');
        return Promise.resolve(passthrough as NodeJS.ReadableStream);
      } catch (err) {
        Logger.error('YouTube: yt-dlp failed:', err instanceof Error ? err.message : String(err));
        throw err;
      }
    });
  }

  getAudioBuffer(url: string): Promise<Buffer> {
    return this.enqueue(() => {
      try {
        Logger.info(`Attempting to buffer YouTube audio via yt-dlp: ${url}`);

        const flags = this.getYtDlpFlags();
        const subprocess = youtubeDl.exec(url, flags);

        // Catch the tinyspawn promise rejection to prevent unhandled rejections
        subprocess.catch(() => { });

        const stdout = subprocess.stdout;

        if (!stdout) {
          throw new Error('yt-dlp: Failed to get stdout stream');
        }

        const chunks: Buffer[] = [];
        return new Promise<Buffer>((resolve, reject) => {
          stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
          stdout.on('end', () => resolve(Buffer.concat(chunks)));
          stdout.on('error', reject);
          void subprocess.on('error', reject);
          void subprocess.on('close', (code: number | null) => {
            if (code !== 0 && code !== null) {
              reject(new Error(`yt-dlp exited with code ${code}`));
            }
          });
        });
      } catch (err) {
        Logger.error(
          'YouTube: yt-dlp buffer failed:',
          err instanceof Error ? err.message : String(err),
        );
        throw err;
      }
    });
  }

  build(video: ytsr.Video): TrackMetadataData {
    return {
      id: video.id ?? '',
      source: 'youtube',
      url: video.url,
      name: video.title ?? 'Unknown',
      duration: video.duration,
      explicit: video.nsfw,
      icon: video.thumbnail?.url,
      artist: {
        name: video.channel?.name ?? 'Unknown Channel',
        id: video.channel?.id ?? '',
        url: video.channel?.url,
        icon: video.channel?.icon.url,
      },
    };
  }
}
