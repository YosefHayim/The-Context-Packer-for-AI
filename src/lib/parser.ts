import { parse } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs';
import type { CodeLocation } from '../types';

/**
 * Parse a TypeScript/JavaScript file and return its AST
 */
export function parseFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    return parse(content, {
      loc: true,
      range: true,
      comment: true,
      jsx: filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
    });
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

/**
 * Get the source code from a file
 */
export function getFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get a specific line from a file
 */
export function getLine(filePath: string, lineNumber: number): string {
  const content = getFileContent(filePath);
  const lines = content.split('\n');
  return lines[lineNumber - 1] || '';
}

/**
 * Get a range of lines from a file
 */
export function getLines(filePath: string, startLine: number, endLine: number): string {
  const content = getFileContent(filePath);
  const lines = content.split('\n');
  return lines.slice(startLine - 1, endLine).join('\n');
}

/**
 * Extract context around a specific location
 */
export function extractContext(
  filePath: string,
  location: CodeLocation,
  contextLines: number = 5
): string {
  const startLine = Math.max(1, location.line - contextLines);
  const endLine = location.line + contextLines;
  return getLines(filePath, startLine, endLine);
}
