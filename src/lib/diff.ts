import type { AnalysisResult, FunctionReference } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * A snapshot of an analysis result with metadata for comparison
 */
export interface AnalysisSnapshot extends AnalysisResult {
  /** ISO 8601 timestamp of when the snapshot was taken */
  timestamp: string;
  /** Version of context-packer that produced the snapshot */
  version: string;
}

/**
 * Result of diffing two analysis snapshots
 */
export interface DiffResult {
  /** The function name being compared */
  functionName: string;
  /** References present in current but not in previous */
  added: FunctionReference[];
  /** References present in previous but not in current */
  removed: FunctionReference[];
  /** References present in both */
  unchanged: FunctionReference[];
  /** Numeric summary of changes */
  summary: {
    added: number;
    removed: number;
    unchanged: number;
  };
}


function referenceKey(ref: FunctionReference): string {
  return ref.location.filePath + ':' + ref.location.line;
}

/**
 * Save an analysis result as a JSON snapshot file
 */
export function saveSnapshot(result: AnalysisResult, outputPath: string): void {
  const snapshot: AnalysisSnapshot = {
    ...result,
    timestamp: new Date().toISOString(),
    version: '0.1.5',
  };

  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), 'utf-8');
}

/**
 * Load an analysis snapshot from a JSON file
 */
export function loadSnapshot(snapshotPath: string): AnalysisSnapshot {
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot file not found: ${snapshotPath}`);
  }

  const content = fs.readFileSync(snapshotPath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in snapshot file: ${snapshotPath}`);
  }

  const snapshot = parsed as Record<string, unknown>;
  if (
    typeof snapshot !== 'object' ||
    snapshot === null ||
    typeof snapshot.functionName !== 'string' ||
    !Array.isArray(snapshot.references)
  ) {
    throw new Error(
      `Invalid snapshot format: file must contain functionName (string) and references (array)`
    );
  }

  return snapshot as unknown as AnalysisSnapshot;
}

/**
 * Compare a previous snapshot with a current analysis result
 */
export function diffAnalysis(
  previous: AnalysisSnapshot,
  current: AnalysisResult
): DiffResult {
  const previousKeys = new Set(previous.references.map(referenceKey));
  const currentKeys = new Set(current.references.map(referenceKey));

  const added: FunctionReference[] = current.references.filter(
    (ref) => !previousKeys.has(referenceKey(ref))
  );
  const removed: FunctionReference[] = previous.references.filter(
    (ref) => !currentKeys.has(referenceKey(ref))
  );
  const unchanged: FunctionReference[] = current.references.filter((ref) =>
    previousKeys.has(referenceKey(ref))
  );

  return {
    functionName: current.functionName,
    added,
    removed,
    unchanged,
    summary: {
      added: added.length,
      removed: removed.length,
      unchanged: unchanged.length,
    },
  };
}

/**
 * Format a diff result as a human-readable string
 */
export function formatDiff(diff: DiffResult): string {
  const lines: string[] = [];

  lines.push(`Analysis Diff: ${diff.functionName}`);
  lines.push(`  + ${diff.summary.added} new reference(s)`);
  lines.push(`  - ${diff.summary.removed} removed reference(s)`);
  lines.push(`  = ${diff.summary.unchanged} unchanged reference(s)`);

  if (diff.added.length > 0) {
    lines.push('');
    lines.push('Added:');
    for (const ref of diff.added) {
      lines.push(`  ${ref.location.filePath}:${ref.location.line}`);
    }
  }

  if (diff.removed.length > 0) {
    lines.push('');
    lines.push('Removed:');
    for (const ref of diff.removed) {
      lines.push(`  ${ref.location.filePath}:${ref.location.line}`);
    }
  }

  return lines.join('\n');
}
