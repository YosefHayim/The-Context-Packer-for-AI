import * as fs from 'fs';
import { SUPPORTED_EXTENSIONS } from '../constants';

export interface WatcherOptions {
  /** Root directory to watch for changes */
  rootDir: string;
  /** Callback invoked when a supported file changes */
  onChange: (filePath: string) => void;
  /** Debounce interval in milliseconds (default: 300) */
  debounceMs?: number;
}


export class Watcher {
  private _running = false;
  private _watcher: fs.FSWatcher | null = null;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private options: Required<WatcherOptions>;

  constructor(options: WatcherOptions) {
    this.options = {
      rootDir: options.rootDir,
      onChange: options.onChange,
      debounceMs: options.debounceMs ?? 300,
    };
  }

  /** Start watching for file changes */
  start(): void {
    if (this._running) return;
    this._running = true;
    this._watcher = fs.watch(
      this.options.rootDir,
      { recursive: true },
      (_eventType: string, filename: string | null) => {
        if (!filename) return;
        if (!Watcher.isSupportedFile(filename)) return;

        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
          this.options.onChange(filename);
        }, this.options.debounceMs);
      },
    );
  }

  /** Stop watching for file changes */
  stop(): void {
    if (this._watcher) {
      this._watcher.close();
      this._watcher = null;
    }
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._running = false;
  }

  /** Whether the watcher is currently active */
  get isRunning(): boolean {
    return this._running;
  }

  /** Check if a filename has a supported extension */
  static isSupportedFile(filename: string): boolean {
    return SUPPORTED_EXTENSIONS.some(ext => filename.endsWith(ext));
  }
}


export function createWatcher(options: WatcherOptions): Watcher {
  return new Watcher(options);
}
