import * as fs from 'fs';
import type { CodeLocation } from '../types';

/**
 * Represents a Python function definition
 */
export interface PythonFunction {
  name: string;
  /** 1-indexed */
  startLine: number;
  /** 1-indexed */
  endLine: number;
  /** Number of leading spaces */
  indentLevel: number;
}

/**
 * Represents a Python class definition
 */
export interface PythonClass {
  name: string;
  /** 1-indexed */
  startLine: number;
  /** 1-indexed */
  endLine: number;
  methods: PythonFunction[];
}

/**
 * AST-like representation of a Python file
 */
export interface PythonAST {
  functions: PythonFunction[];
  classes: PythonClass[];
}

const FUNCTION_DEF_RE = /^(\s*)def\s+(\w+)\s*\(/;
const CLASS_DEF_RE = /^(\s*)class\s+(\w+)/;

/**
 * Read a Python file's content with error handling.
 */
export function getPythonFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to read Python file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Determine the end line of an indentation-based block.
 * Ends when a non-empty, non-comment line at same or lesser indent is found.
 */
function findBlockEndLine(lines: string[], startLine: number, blockIndent: number): number {
  let endLine = startLine;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '' || line.trim().startsWith('#')) {
      continue;
    }

    const currentIndent = line.length - line.trimStart().length;
    if (currentIndent <= blockIndent) {
      break;
    }

    endLine = i + 1;
  }

  return endLine;
}

/**
 * Parse a Python file and extract function and class definitions.
 */
export function parsePythonFile(filePath: string): PythonAST {
  let content: string;
  try {
    content = getPythonFileContent(filePath);
  } catch {
    return { functions: [], classes: [] };
  }

  const lines = content.split('\n');
  const functions: PythonFunction[] = [];
  const classes: PythonClass[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const classMatch = CLASS_DEF_RE.exec(line);
    if (classMatch) {
      const indent = classMatch[1].length;
      const name = classMatch[2];
      const startLine = i + 1;
      const endLine = findBlockEndLine(lines, i + 1, indent);
      const methods = extractMethods(lines, i + 1, endLine, indent);

      classes.push({ name, startLine, endLine, methods });
      continue;
    }

    const funcMatch = FUNCTION_DEF_RE.exec(line);
    if (funcMatch) {
      const indent = funcMatch[1].length;
      // Only top-level functions, not class methods
      if (indent === 0) {
        const name = funcMatch[2];
        const startLine = i + 1;
        const endLine = findBlockEndLine(lines, i + 1, indent);

        functions.push({ name, startLine, endLine, indentLevel: indent });
      }
    }
  }

  return { functions, classes };
}

function extractMethods(
  lines: string[],
  classBodyStart: number,
  classEndLine: number,
  classIndent: number
): PythonFunction[] {
  const methods: PythonFunction[] = [];

  for (let i = classBodyStart; i < classEndLine; i++) {
    const line = lines[i];
    const funcMatch = FUNCTION_DEF_RE.exec(line);

    if (funcMatch) {
      const indent = funcMatch[1].length;
      if (indent > classIndent) {
        const name = funcMatch[2];
        const startLine = i + 1;
        const endLine = findBlockEndLine(lines, i + 1, indent);

        methods.push({ name, startLine, endLine, indentLevel: indent });
      }
    }
  }

  return methods;
}

/**
 * Find all call-site references to a function name in a Python file.
 */
export function findPythonReferences(filePath: string, functionName: string): CodeLocation[] {
  let content: string;
  try {
    content = getPythonFileContent(filePath);
  } catch {
    return [];
  }

  const lines = content.split('\n');
  const locations: CodeLocation[] = [];
  const callPattern = new RegExp(`\\b${escapeRegExp(functionName)}\\s*\\(`, 'g');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (FUNCTION_DEF_RE.test(line) && line.includes(`def ${functionName}`)) {
      continue;
    }

    let match: RegExpExecArray | null;
    callPattern.lastIndex = 0;

    while ((match = callPattern.exec(line)) !== null) {
      locations.push({
        filePath,
        line: i + 1,
        column: match.index,
      });
    }
  }

  return locations;
}

/**
 * Find the enclosing function or class scope for a given line number.
 * Walks backward to find the nearest `def` or `class` at a lesser indentation.
 */
export function findPythonEnclosingScope(
  filePath: string,
  line: number
): string | undefined {
  let content: string;
  try {
    content = getPythonFileContent(filePath);
  } catch {
    return undefined;
  }

  const lines = content.split('\n');
  if (line < 1 || line > lines.length) {
    return undefined;
  }

  const targetLine = lines[line - 1];
  let targetIndent: number;
  if (targetLine.trim() === '') {
    targetIndent = findNearestIndent(lines, line - 1);
  } else {
    targetIndent = targetLine.length - targetLine.trimStart().length;
  }

  for (let i = line - 2; i >= 0; i--) {
    const currentLine = lines[i];
    if (currentLine.trim() === '') {
      continue;
    }

    const funcMatch = FUNCTION_DEF_RE.exec(currentLine);
    if (funcMatch) {
      const indent = funcMatch[1].length;
      if (indent < targetIndent) {
        return funcMatch[2];
      }
    }

    const classMatch = CLASS_DEF_RE.exec(currentLine);
    if (classMatch) {
      const indent = classMatch[1].length;
      if (indent < targetIndent) {
        return classMatch[2];
      }
    }
  }

  return undefined;
}

function findNearestIndent(lines: string[], fromIndex: number): number {
  for (let i = fromIndex - 1; i >= 0; i--) {
    if (lines[i].trim() !== '') {
      return lines[i].length - lines[i].trimStart().length;
    }
  }
  return 0;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
