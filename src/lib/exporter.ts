import * as path from 'path';
import type { AnalysisResult } from '../types';

/**
 * Export format JSON - structured data for programmatic use
 */
export function formatAsJSON(result: AnalysisResult, rootDir: string): string {
  const formattedResult = {
    functionName: result.functionName,
    totalReferences: result.count,
    references: result.references.map((ref) => ({
      file: path.relative(rootDir, ref.location.filePath),
      line: ref.location.line,
      column: ref.location.column,
      depth: ref.depth,
      enclosingScope: ref.enclosingScope,
      context: ref.context,
    })),
  };

  return JSON.stringify(formattedResult, null, 2);
}

/**
 * Export format CSV - tabular data for spreadsheets
 */
export function formatAsCSV(result: AnalysisResult, rootDir: string): string {
  const lines: string[] = [];
  
  // Header
  lines.push('File,Line,Column,Depth,Scope,Context');
  
  // Data rows
  result.references.forEach((ref) => {
    const relativePath = path.relative(rootDir, ref.location.filePath);
    const scope = ref.enclosingScope || '';
    // Escape context for CSV (remove newlines, escape quotes)
    const context = ref.context
      .replace(/\n/g, ' ')
      .replace(/"/g, '""')
      .trim();
    
    lines.push(
      `"${relativePath}",${ref.location.line},${ref.location.column},"${ref.depth}","${scope}","${context}"`
    );
  });
  
  return lines.join('\n');
}

/**
 * Export format Plain Text - simple text format without markdown
 */
export function formatAsPlainText(result: AnalysisResult, rootDir: string): string {
  const lines: string[] = [];
  
  lines.push(`Function: ${result.functionName}`);
  lines.push(`Total References: ${result.count}`);
  lines.push('');
  
  if (result.count === 0) {
    lines.push(`No references found for function '${result.functionName}'.`);
    return lines.join('\n');
  }
  
  result.references.forEach((ref, index) => {
    const relativePath = path.relative(rootDir, ref.location.filePath);
    
    lines.push(`[${index + 1}] ${relativePath}:${ref.location.line}`);
    if (ref.enclosingScope) {
      lines.push(`    Scope: ${ref.enclosingScope}`);
    }
    lines.push(`    Depth: ${ref.depth}`);
    lines.push('');
    
    // Indent context
    const contextLines = ref.context.split('\n');
    contextLines.forEach((line) => {
      lines.push(`    ${line}`);
    });
    
    lines.push('');
  });
  
  return lines.join('\n');
}

/**
 * Export format XML - hierarchical structured format
 */
export function formatAsXML(result: AnalysisResult, rootDir: string): string {
  const lines: string[] = [];
  
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<analysis>');
  lines.push(`  <function>${escapeXML(result.functionName)}</function>`);
  lines.push(`  <totalReferences>${result.count}</totalReferences>`);
  lines.push('  <references>');
  
  result.references.forEach((ref) => {
    const relativePath = path.relative(rootDir, ref.location.filePath);
    
    lines.push('    <reference>');
    lines.push(`      <file>${escapeXML(relativePath)}</file>`);
    lines.push(`      <line>${ref.location.line}</line>`);
    lines.push(`      <column>${ref.location.column}</column>`);
    lines.push(`      <depth>${escapeXML(ref.depth)}</depth>`);
    if (ref.enclosingScope) {
      lines.push(`      <scope>${escapeXML(ref.enclosingScope)}</scope>`);
    }
    lines.push(`      <context><![CDATA[${ref.context}]]></context>`);
    lines.push('    </reference>');
  });
  
  lines.push('  </references>');
  lines.push('</analysis>');
  
  return lines.join('\n');
}

/**
 * Helper function to escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Unified export function that delegates to appropriate formatter
 */
export function exportAs(
  format: 'json' | 'csv' | 'txt' | 'xml' | 'markdown' | 'text',
  result: AnalysisResult,
  rootDir: string
): string {
  switch (format) {
    case 'json':
      return formatAsJSON(result, rootDir);
    case 'csv':
      return formatAsCSV(result, rootDir);
    case 'txt':
      return formatAsPlainText(result, rootDir);
    case 'xml':
      return formatAsXML(result, rootDir);
    case 'markdown':
    case 'text':
      // These are handled by the existing formatter
      throw new Error('Use formatForLLM or formatAsText for markdown/text formats');
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
