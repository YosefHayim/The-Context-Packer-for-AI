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
export { findFiles, findFilesSync, isSupportedFile } from './utils/file-scanner';

export {
  ContextDepth,
  type CodeLocation,
  type FunctionReference,
  type AnalysisResult,
  type ContextPackerOptions,
} from './types';
