import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Watcher, createWatcher } from '../../lib/watcher';

describe('Watcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should instantiate with default debounceMs', () => {
    const onChange = vi.fn();
    const watcher = new Watcher({ rootDir: '/tmp', onChange });
    expect(watcher).toBeInstanceOf(Watcher);
    expect(watcher.isRunning).toBe(false);
  });

  it('should have isRunning false before start', () => {
    const watcher = new Watcher({ rootDir: '/tmp', onChange: vi.fn() });
    expect(watcher.isRunning).toBe(false);
  });

  it('should allow stop() when not running without error', () => {
    const watcher = new Watcher({ rootDir: '/tmp', onChange: vi.fn() });
    expect(() => watcher.stop()).not.toThrow();
    expect(watcher.isRunning).toBe(false);
  });

  describe('isSupportedFile', () => {
    it('should accept .ts, .tsx, .js, .jsx files', () => {
      expect(Watcher.isSupportedFile('component.ts')).toBe(true);
      expect(Watcher.isSupportedFile('component.tsx')).toBe(true);
      expect(Watcher.isSupportedFile('index.js')).toBe(true);
      expect(Watcher.isSupportedFile('app.jsx')).toBe(true);
      expect(Watcher.isSupportedFile('src/lib/parser.ts')).toBe(true);
    });

    it('should reject unsupported file extensions', () => {
      expect(Watcher.isSupportedFile('readme.md')).toBe(false);
      expect(Watcher.isSupportedFile('styles.css')).toBe(false);
      expect(Watcher.isSupportedFile('data.json')).toBe(false);
      expect(Watcher.isSupportedFile('image.png')).toBe(false);
      expect(Watcher.isSupportedFile('.gitignore')).toBe(false);
    });
  });

  it('should return a Watcher instance from createWatcher', () => {
    const watcher = createWatcher({ rootDir: '/tmp', onChange: vi.fn() });
    expect(watcher).toBeInstanceOf(Watcher);
    expect(watcher.isRunning).toBe(false);
  });

  it('should accept custom debounceMs', () => {
    const watcher = createWatcher({
      rootDir: '/tmp',
      onChange: vi.fn(),
      debounceMs: 500,
    });
    expect(watcher).toBeInstanceOf(Watcher);
  });
});
