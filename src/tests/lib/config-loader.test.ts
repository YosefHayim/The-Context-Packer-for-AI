import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync, existsSync } from 'fs';
import { join } from 'path';
import { loadConfig, mergeConfig, validateConfig, DEFAULT_CONFIG } from '../../lib/config-loader';

const TEST_DIR = join(process.cwd(), '.test-config-tmp');

describe('Config Loader', () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    const testFiles = [
      join(TEST_DIR, '.contextpackerrc.json'),
      join(TEST_DIR, '.contextpacker.config.json'),
      join(TEST_DIR, 'contextpacker.config.json'),
    ];
    
    testFiles.forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
    
    if (existsSync(TEST_DIR)) {
      rmdirSync(TEST_DIR);
    }
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', () => {
      const config = loadConfig(TEST_DIR);
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should load config from .contextpackerrc.json', () => {
      const userConfig = {
        defaultDepth: 'snippet' as const,
        autoCopy: true,
      };
      
      writeFileSync(
        join(TEST_DIR, '.contextpackerrc.json'),
        JSON.stringify(userConfig)
      );

      const config = loadConfig(TEST_DIR);
      expect(config.defaultDepth).toBe('snippet');
      expect(config.autoCopy).toBe(true);
    });

    it('should load config from .contextpacker.config.json', () => {
      const userConfig = {
        defaultFormat: 'json' as const,
        preferredAI: 'claude',
      };
      
      writeFileSync(
        join(TEST_DIR, '.contextpacker.config.json'),
        JSON.stringify(userConfig)
      );

      const config = loadConfig(TEST_DIR);
      expect(config.defaultFormat).toBe('json');
      expect(config.preferredAI).toBe('claude');
    });

    it('should prefer .contextpackerrc.json over other config files', () => {
      writeFileSync(
        join(TEST_DIR, '.contextpackerrc.json'),
        JSON.stringify({ defaultDepth: 'snippet' })
      );
      
      writeFileSync(
        join(TEST_DIR, '.contextpacker.config.json'),
        JSON.stringify({ defaultDepth: 'module' })
      );

      const config = loadConfig(TEST_DIR);
      expect(config.defaultDepth).toBe('snippet');
    });

    it('should handle invalid JSON gracefully', () => {
      writeFileSync(
        join(TEST_DIR, '.contextpackerrc.json'),
        'invalid json {'
      );

      const config = loadConfig(TEST_DIR);
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('mergeConfig', () => {
    it('should merge user config with defaults', () => {
      const userConfig = {
        defaultDepth: 'snippet' as const,
        autoCopy: true,
      };

      const merged = mergeConfig(DEFAULT_CONFIG, userConfig);
      expect(merged.defaultDepth).toBe('snippet');
      expect(merged.autoCopy).toBe(true);
      expect(merged.defaultFormat).toBe(DEFAULT_CONFIG.defaultFormat);
    });

    it('should replace arrays, not merge them', () => {
      const userConfig = {
        include: ['**/*.py'],
        exclude: ['**/venv/**'],
      };

      const merged = mergeConfig(DEFAULT_CONFIG, userConfig);
      expect(merged.include).toEqual(['**/*.py']);
      expect(merged.exclude).toEqual(['**/venv/**']);
    });

    it('should merge customAIServices objects', () => {
      const userConfig = {
        customAIServices: {
          perplexity: 'https://www.perplexity.ai',
        },
      };

      const merged = mergeConfig(DEFAULT_CONFIG, userConfig);
      expect(merged.customAIServices).toEqual({
        perplexity: 'https://www.perplexity.ai',
      });
    });
  });

  describe('validateConfig', () => {
    it('should return no errors for valid config', () => {
      const errors = validateConfig(DEFAULT_CONFIG);
      expect(errors).toHaveLength(0);
    });

    it('should return error for invalid defaultDepth', () => {
      const config = {
        ...DEFAULT_CONFIG,
        defaultDepth: 'invalid' as any,
      };

      const errors = validateConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid defaultDepth');
    });

    it('should return error for invalid defaultFormat', () => {
      const config = {
        ...DEFAULT_CONFIG,
        defaultFormat: 'invalid' as any,
      };

      const errors = validateConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid defaultFormat');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const config = {
        ...DEFAULT_CONFIG,
        defaultDepth: 'invalid' as any,
        defaultFormat: 'invalid' as any,
      };

      const errors = validateConfig(config);
      expect(errors).toHaveLength(2);
    });
  });

  describe('Custom AI Services', () => {
    it('should support custom AI service URLs', () => {
      const userConfig = {
        customAIServices: {
          perplexity: 'https://www.perplexity.ai',
          copilot: 'https://github.com/copilot',
        },
      };

      writeFileSync(
        join(TEST_DIR, '.contextpackerrc.json'),
        JSON.stringify(userConfig)
      );

      const config = loadConfig(TEST_DIR);
      expect(config.customAIServices).toEqual({
        perplexity: 'https://www.perplexity.ai',
        copilot: 'https://github.com/copilot',
      });
    });
  });

  describe('File patterns', () => {
    it('should support custom include patterns', () => {
      const userConfig = {
        include: ['**/*.py', '**/*.rb', '**/*.go'],
      };

      writeFileSync(
        join(TEST_DIR, '.contextpackerrc.json'),
        JSON.stringify(userConfig)
      );

      const config = loadConfig(TEST_DIR);
      expect(config.include).toEqual(['**/*.py', '**/*.rb', '**/*.go']);
    });

    it('should support custom exclude patterns', () => {
      const userConfig = {
        exclude: ['**/venv/**', '**/target/**', '**/build/**'],
      };

      writeFileSync(
        join(TEST_DIR, '.contextpackerrc.json'),
        JSON.stringify(userConfig)
      );

      const config = loadConfig(TEST_DIR);
      expect(config.exclude).toEqual(['**/venv/**', '**/target/**', '**/build/**']);
    });
  });
});
