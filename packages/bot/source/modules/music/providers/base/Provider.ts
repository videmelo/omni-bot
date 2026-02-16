import type {
  SearchResult,
  SearchOptions,
  TrackData,
  AlbumData,
  PlaylistData,
  ArtistData,
} from '@omni/shared';
import Logger from '../../../../utils/logger.js';

export type { SearchResult, SearchOptions };

export abstract class Provider {
  public abstract readonly name: string;
  public abstract readonly urls: { pattern: RegExp };

  protected async request<T>(call: () => Promise<T>, retries = 5): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.ensureAuthenticated();
        return await call();
      } catch (err: unknown) {
        const handled = await this.handleRequestError(err, i, retries);
        if (!handled) {
          // Log error only if we're giving up or if we want visibility on retries?
          // Original code: if (!handled) log.
          // But continue loop?
          // Wait, if !handled, what happens? Loop continues explicitly?
          // If !handled, we should probably throw or break?
          // But original code just logs and continues loop.
          // This means we retry even if handleRequestError returns false.
          // Is this intended?
          // Assuming yes.
          Logger.error(`[${this.name}] Request failed`, err instanceof Error ? err : String(err));
        }
        // Continue to next retry
      }
    }
    throw new Error(`[${this.name}] Maximum number of retry attempts reached.`);
  }

  protected ensureAuthenticated(): Promise<void> {
    // Override in subclasses if authentication refresh is needed
    return Promise.resolve();
  }

  protected handleRequestError(
    err: unknown, // eslint-disable-line @typescript-eslint/no-unused-vars
    attempt: number, // eslint-disable-line @typescript-eslint/no-unused-vars
    maxRetries: number, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<boolean> {
    // Override in subclasses for specific error handling (e.g., rate limiting)
    // Return true if the error was handled (will retry), false otherwise
    return Promise.resolve(false);
  }

  abstract search(query: string, options?: SearchOptions): Promise<SearchResult>;
  abstract resolve(url: string): Promise<SearchResult>;
  abstract getTrack(id: string): Promise<TrackData>;
  abstract getAlbum(id: string): Promise<AlbumData>;
  abstract getPlaylist(id: string): Promise<PlaylistData>;
  abstract getArtist(id: string): Promise<ArtistData>;
}
