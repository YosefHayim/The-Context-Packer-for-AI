/**
 * Context depth levels for code extraction
 */
export enum ContextDepth {
  /** Just the line where the function is called */
  SNIPPET = 'snippet',
  /** The enclosing function/scope containing the call */
  LOGIC = 'logic',
  /** The entire file containing the call */
  MODULE = 'module',
}

/**
 * Location of a code reference
 */
export interface CodeLocation {
  /** Absolute file path */
  filePath: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (0-indexed) */
  column: number;
}

/**
 * A single reference to a function with its context
 */
export interface FunctionReference {
  /** Where the reference was found */
  location: CodeLocation;
  /** The extracted code context */
  context: string;
  /** The depth level of this context */
  depth: ContextDepth;
  /** The name of the enclosing function/scope (if applicable) */
  enclosingScope?: string;
}

/**
 * Complete analysis result for a function
 */
export interface AnalysisResult {
  /** The function name being analyzed */
  functionName: string;
  /** All references found */
  references: FunctionReference[];
  /** Total count of references */
  count: number;
}

/**
 * Configuration options for the context packer
 */
export interface ContextPackerOptions {
  /** Root directory to search */
  rootDir: string;
  /** File patterns to include (e.g., ['*.ts', '*.tsx']) */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /** Context depth to extract */
  depth: ContextDepth;
  /** Maximum number of lines for logic context */
  maxContextLines?: number;
}
