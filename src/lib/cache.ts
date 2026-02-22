/**
 * AST and file content cache for Context Packer
 * Eliminates redundant file reads and AST parsing for repeated accesses
 */

import * as fs from 'fs';
import type { TSESTree } from '@typescript-eslint/typescript-estree';

interface CacheEntry<T> {
  data: T;
  mtime: number;
  size: number;
}

/**
 * LRU-style cache with file modification time validation
 */
export class FileCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;

  constructor(maxEntries: number = 200) {
    this.maxEntries = maxEntries;
  }

  /**
   * Get a cached entry if it exists and the file hasn't been modified
   */
  get(filePath: string): T | undefined {
    const entry = this.cache.get(filePath);
    if (!entry) return undefined;

    try {
      const stat = fs.statSync(filePath);
      const mtime = stat.mtimeMs;
      const size = stat.size;

      // Invalidate if file was modified
      if (mtime !== entry.mtime || size !== entry.size) {
        this.cache.delete(filePath);
        return undefined;
      }

      return entry.data;
    } catch {
      // File doesn't exist anymore — remove from cache
      this.cache.delete(filePath);
      return undefined;
    }
  }

  /**
   * Store a value in the cache
   */
  set(filePath: string, data: T): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    try {
      const stat = fs.statSync(filePath);
      this.cache.set(filePath, {
        data,
        mtime: stat.mtimeMs,
        size: stat.size,
      });
    } catch {
      // Can't stat the file — don't cache
    }
  }

  /**
   * Check if a file is in cache and still valid
   */
  has(filePath: string): boolean {
    return this.get(filePath) !== undefined;
  }

  /**
   * Remove a specific entry
   */
  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): { entries: number; maxEntries: number } {
    return {
      entries: this.cache.size,
      maxEntries: this.maxEntries,
    };
  }
}

// Singleton caches for AST and file content
let astCache: FileCache<TSESTree.Program> | null = null;
let contentCache: FileCache<string> | null = null;

/**
 * Get or create the AST cache singleton
 */
export function getASTCache(maxEntries?: number): FileCache<TSESTree.Program> {
  if (!astCache) {
    astCache = new FileCache<TSESTree.Program>(maxEntries);
  }
  return astCache;
}

/**
 * Get or create the file content cache singleton
 */
export function getContentCache(maxEntries?: number): FileCache<string> {
  if (!contentCache) {
    contentCache = new FileCache<string>(maxEntries);
  }
  return contentCache;
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  if (astCache) astCache.clear();
  if (contentCache) contentCache.clear();
}

/**
 * Get combined cache stats
 */
export function getCacheStats(): { ast: { entries: number; maxEntries: number }; content: { entries: number; maxEntries: number } } {
  return {
    ast: astCache ? astCache.getStats() : { entries: 0, maxEntries: 0 },
    content: contentCache ? contentCache.getStats() : { entries: 0, maxEntries: 0 },
  };
}
