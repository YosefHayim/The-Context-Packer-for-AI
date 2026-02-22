import { describe, it, expect, beforeEach } from 'vitest';
import { FileCache, clearAllCaches, getCacheStats, getASTCache, getContentCache } from '../../lib/cache';
import * as fs from 'fs';
import * as path from 'path';

describe('Cache', () => {
  const fixturesPath = path.join(__dirname, '../fixtures');
  const sampleFile = path.join(fixturesPath, 'sample.ts');

  beforeEach(() => {
    clearAllCaches();
  });

  describe('FileCache', () => {
    it('should return undefined on cache miss', () => {
      const cache = new FileCache<string>();
      const result = cache.get(sampleFile);
      expect(result).toBeUndefined();
    });

    it('should return cached data on cache hit', () => {
      const cache = new FileCache<string>();
      cache.set(sampleFile, 'cached-content');
      const result = cache.get(sampleFile);
      expect(result).toBe('cached-content');
    });

    it('should invalidate when mtime changes', () => {
      const cache = new FileCache<string>();
      // Create a temp file for mtime testing
      const tmpFile = path.join(fixturesPath, '__cache_test_tmp.ts');
      fs.writeFileSync(tmpFile, 'original');

      try {
        cache.set(tmpFile, 'cached-value');
        expect(cache.get(tmpFile)).toBe('cached-value');

        // Modify file to change mtime — write different content AND set a future mtime
        fs.writeFileSync(tmpFile, 'modified-content');
        const futureTime = Date.now() + 10000;
        fs.utimesSync(tmpFile, futureTime / 1000, futureTime / 1000);

        // Cache should invalidate since file changed
        const result = cache.get(tmpFile);
        expect(result).toBeUndefined();
      } finally {
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
      }
    });

    it('should evict oldest entry when at capacity (LRU)', () => {
      const cache = new FileCache<string>(2);
      // We need 3 real files for the LRU test
      const tmpFile1 = path.join(fixturesPath, '__cache_lru_1.ts');
      const tmpFile2 = path.join(fixturesPath, '__cache_lru_2.ts');
      const tmpFile3 = path.join(fixturesPath, '__cache_lru_3.ts');

      try {
        fs.writeFileSync(tmpFile1, 'a');
        fs.writeFileSync(tmpFile2, 'b');
        fs.writeFileSync(tmpFile3, 'c');

        cache.set(tmpFile1, 'first');
        cache.set(tmpFile2, 'second');
        expect(cache.size).toBe(2);

        // Adding a third should evict the first
        cache.set(tmpFile3, 'third');
        expect(cache.size).toBe(2);
        expect(cache.get(tmpFile1)).toBeUndefined();
        expect(cache.get(tmpFile2)).toBe('second');
        expect(cache.get(tmpFile3)).toBe('third');
      } finally {
        for (const f of [tmpFile1, tmpFile2, tmpFile3]) {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        }
      }
    });
  });

  describe('clearAllCaches', () => {
    it('should clear both AST and content caches', () => {
      const astCache = getASTCache();
      const contentCache = getContentCache();

      // Populate both caches using a real file
      const content = fs.readFileSync(sampleFile, 'utf-8');
      contentCache.set(sampleFile, content);

      expect(contentCache.get(sampleFile)).toBe(content);

      clearAllCaches();

      expect(contentCache.size).toBe(0);
      expect(astCache.size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should report accurate cache statistics', () => {
      const contentCache = getContentCache();
      const stats1 = getCacheStats();
      expect(stats1.content.entries).toBe(0);
      expect(stats1.ast.entries).toBe(0);

      contentCache.set(sampleFile, 'test-content');
      const stats2 = getCacheStats();
      expect(stats2.content.entries).toBe(1);
      expect(stats2.content.maxEntries).toBe(200);
    });
  });
});
