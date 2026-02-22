/**
 * Context Packer for AI
 * 
 * A tool for extracting semantic context around function calls in codebases,
 * optimized for providing context to Large Language Models (LLMs).
 */

export { ContextPacker, createContextPacker } from './lib/context-packer';
export { formatForLLM, formatAsText } from './lib/formatter';
export { exportAs, formatAsJSON, formatAsCSV, formatAsPlainText, formatAsXML } from './lib/exporter';
export { findReferencesInFile, findEnclosingScope } from './lib/reference-finder';
export { extractReferenceContext, extractMultipleContexts } from './lib/context-extractor';
export { parseFile, getFileContent, getLine, getLines } from './lib/parser';
export { FileCache, getASTCache, getContentCache, clearAllCaches, getCacheStats } from './lib/cache';
export { saveSnapshot, loadSnapshot, diffAnalysis, formatDiff } from './lib/diff';
export { createWatcher, Watcher, type WatcherOptions } from './lib/watcher';
export { findFiles, findFilesSync, isSupportedFile } from './utils/file-scanner';
export {
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_EXCLUDE_PATTERNS,
  SUPPORTED_EXTENSIONS,
  VALID_DEPTHS,
  VALID_FORMATS,
  VALID_AI_SERVICES,
  AI_SERVICE_URLS,
} from './constants';

export {
  ContextDepth,
  type CodeLocation,
  type FunctionReference,
  type AnalysisResult,
  type ContextPackerOptions,
} from './types';
