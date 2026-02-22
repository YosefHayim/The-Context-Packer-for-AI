import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync, writeFileSync, unlinkSync, mkdirSync, rmdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getFileContent } from '../../lib/parser';
import { loadConfig, validateConfig, DEFAULT_CONFIG } from '../../lib/config-loader';
import {
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_EXCLUDE_PATTERNS,
  SUPPORTED_EXTENSIONS,
  VALID_DEPTHS,
  VALID_FORMATS,
  VALID_AI_SERVICES,
  AI_SERVICE_URLS,
} from '../../constants';

describe('Bug Fixes', () => {

  describe('Bug #6 - Parser getFileContent crash', () => {
    it('should throw an Error for non-existent file', () => {
      expect(() => getFileContent('/nonexistent/path')).toThrow(Error);
    });

    it('should throw error with "Failed to read file" in message', () => {
      expect(() => getFileContent('/nonexistent/path')).toThrow('Failed to read file');
    });

    it('should include the file path in the error message', () => {
      expect(() => getFileContent('/nonexistent/path')).toThrow('/nonexistent/path');
    });
  });


  describe('Bug #7 - Config malformed JSON', () => {
    const TEST_DIR = join(process.cwd(), '.test-bugfix7-tmp');

    beforeEach(() => {
      if (!existsSync(TEST_DIR)) {
        mkdirSync(TEST_DIR, { recursive: true });
      }
    });

    afterEach(() => {
      const configFile = join(TEST_DIR, '.contextpackerrc.json');
      if (existsSync(configFile)) {
        unlinkSync(configFile);
      }
      if (existsSync(TEST_DIR)) {
        rmdirSync(TEST_DIR);
      }
    });

    it('should return DEFAULT_CONFIG when config has invalid JSON', () => {
      writeFileSync(join(TEST_DIR, '.contextpackerrc.json'), 'not valid json {{{');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const config = loadConfig(TEST_DIR);
      expect(config).toEqual(DEFAULT_CONFIG);
      spy.mockRestore();
    });

    it('should log error when config has invalid JSON', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      writeFileSync(join(TEST_DIR, '.contextpackerrc.json'), '{ broken }');
      loadConfig(TEST_DIR);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should reject invalid defaultDepth via validateConfig', () => {
      const config = JSON.parse('{"defaultDepth": "invalid"}');
      const errors = validateConfig(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid defaultDepth');
    });

    it('should reject invalid defaultFormat via validateConfig', () => {
      const config = JSON.parse('{"defaultFormat": "invalid"}');
      const errors = validateConfig(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid defaultFormat');
    });

    it('should strip invalid fields from partial config via loadConfig', () => {
      writeFileSync(
        join(TEST_DIR, '.contextpackerrc.json'),
        JSON.stringify({ defaultDepth: 'invalid', autoCopy: true })
      );
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const config = loadConfig(TEST_DIR);
      expect(config.defaultDepth).toBe(DEFAULT_CONFIG.defaultDepth);
      expect(config.autoCopy).toBe(true);
      spy.mockRestore();
    });
  });


  describe('Bug #9 - Dynamic require', () => {
    it('should use top-level import for path module in multi-function-analyzer.ts', () => {
      const filePath = join(__dirname, '../../lib/multi-function-analyzer.ts');
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("import * as path from 'path'");
    });

    it('should not use require for path module in multi-function-analyzer.ts', () => {
      const filePath = join(__dirname, '../../lib/multi-function-analyzer.ts');
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain("require('path')");
    });
  });


  describe('Bug #11 - Shared constants', () => {
    describe('constants are exported with expected values', () => {
      it('should export DEFAULT_INCLUDE_PATTERNS with TS and JS patterns', () => {
        expect(Array.isArray(DEFAULT_INCLUDE_PATTERNS)).toBe(true);
        expect(DEFAULT_INCLUDE_PATTERNS).toContain('**/*.ts');
        expect(DEFAULT_INCLUDE_PATTERNS).toContain('**/*.tsx');
        expect(DEFAULT_INCLUDE_PATTERNS).toContain('**/*.js');
        expect(DEFAULT_INCLUDE_PATTERNS).toContain('**/*.jsx');
      });

      it('should export DEFAULT_EXCLUDE_PATTERNS with common ignore patterns', () => {
        expect(Array.isArray(DEFAULT_EXCLUDE_PATTERNS)).toBe(true);
        expect(DEFAULT_EXCLUDE_PATTERNS).toContain('**/node_modules/**');
        expect(DEFAULT_EXCLUDE_PATTERNS).toContain('**/dist/**');
      });

      it('should export SUPPORTED_EXTENSIONS', () => {
        expect(Array.isArray(SUPPORTED_EXTENSIONS)).toBe(true);
        expect(SUPPORTED_EXTENSIONS).toContain('.ts');
        expect(SUPPORTED_EXTENSIONS).toContain('.tsx');
        expect(SUPPORTED_EXTENSIONS).toContain('.js');
        expect(SUPPORTED_EXTENSIONS).toContain('.jsx');
      });

      it('should export VALID_DEPTHS with all depth options', () => {
        expect(VALID_DEPTHS).toContain('snippet');
        expect(VALID_DEPTHS).toContain('logic');
        expect(VALID_DEPTHS).toContain('module');
      });

      it('should export VALID_FORMATS with all format options', () => {
        expect(VALID_FORMATS).toContain('markdown');
        expect(VALID_FORMATS).toContain('text');
        expect(VALID_FORMATS).toContain('json');
        expect(VALID_FORMATS).toContain('csv');
        expect(VALID_FORMATS).toContain('txt');
        expect(VALID_FORMATS).toContain('xml');
      });

      it('should export VALID_AI_SERVICES', () => {
        expect(VALID_AI_SERVICES).toContain('chatgpt');
        expect(VALID_AI_SERVICES).toContain('claude');
        expect(VALID_AI_SERVICES).toContain('gemini');
      });

      it('should export AI_SERVICE_URLS with correct URLs', () => {
        expect(AI_SERVICE_URLS).toHaveProperty('chatgpt');
        expect(AI_SERVICE_URLS).toHaveProperty('claude');
        expect(AI_SERVICE_URLS).toHaveProperty('gemini');
        expect(AI_SERVICE_URLS.chatgpt).toBe('https://chat.openai.com');
        expect(AI_SERVICE_URLS.claude).toBe('https://claude.ai');
        expect(AI_SERVICE_URLS.gemini).toBe('https://gemini.google.com');
      });
    });

    describe('source files import from constants module', () => {
      it('file-scanner.ts should import from constants', () => {
        const filePath = join(__dirname, '../../utils/file-scanner.ts');
        const content = readFileSync(filePath, 'utf-8');
        expect(content).toContain("from '../constants'");
      });

      it('config-loader.ts should import from constants', () => {
        const filePath = join(__dirname, '../../lib/config-loader.ts');
        const content = readFileSync(filePath, 'utf-8');
        expect(content).toContain("from '../constants'");
      });

      it('context-packer.ts should import from constants', () => {
        const filePath = join(__dirname, '../../lib/context-packer.ts');
        const content = readFileSync(filePath, 'utf-8');
        expect(content).toContain("from '../constants'");
      });
    });
  });
});
