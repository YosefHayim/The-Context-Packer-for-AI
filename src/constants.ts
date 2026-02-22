/**
 * Shared constants for Context Packer
 * Single source of truth for default patterns and configuration values
 */

/** Default file patterns to include in analysis */
export const DEFAULT_INCLUDE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.py',
];

/** Default file patterns to exclude from analysis */
export const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
];

/** Supported file extensions for analysis */
export const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py'];

/** Valid context depth values */
export const VALID_DEPTHS = ['snippet', 'logic', 'module'] as const;

/** Valid output format values */
export const VALID_FORMATS = ['markdown', 'text', 'json', 'csv', 'txt', 'xml'] as const;

/** Valid AI service names */
export const VALID_AI_SERVICES = ['chatgpt', 'claude', 'gemini'] as const;

/** AI service URLs */
export const AI_SERVICE_URLS: Record<string, string> = {
  chatgpt: 'https://chat.openai.com',
  claude: 'https://claude.ai',
  gemini: 'https://gemini.google.com',
};
