import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveSnapshot, loadSnapshot, diffAnalysis, formatDiff } from '../../lib/diff';
import type { AnalysisSnapshot, DiffResult } from '../../lib/diff';
import type { AnalysisResult, FunctionReference } from '../../types';
import { ContextDepth } from '../../types';
import { tmpdir } from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('diff', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(tmpdir(), 'diff-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const makeRef = (filePath: string, line: number): FunctionReference => ({
    location: { filePath, line, column: 0 },
    context: `call at ${filePath}:${line}`,
    depth: ContextDepth.SNIPPET,
  });

  const mockResult: AnalysisResult = {
    functionName: 'testFunc',
    references: [
      makeRef('/src/app.ts', 10),
      makeRef('/src/utils.ts', 25),
    ],
    count: 2,
  };

  describe('saveSnapshot', () => {
    it('should write valid JSON with timestamp and version', () => {
      const outputPath = path.join(tempDir, 'snapshot.json');
      saveSnapshot(mockResult, outputPath);

      const content = fs.readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(content) as AnalysisSnapshot;

      expect(parsed.functionName).toBe('testFunc');
      expect(parsed.references).toHaveLength(2);
      expect(parsed.count).toBe(2);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.version).toBe('0.2.0');
    });

    it('should create parent directories if they do not exist', () => {
      const outputPath = path.join(tempDir, 'nested', 'deep', 'snapshot.json');
      saveSnapshot(mockResult, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('loadSnapshot', () => {
    it('should load a previously saved snapshot', () => {
      const snapshotPath = path.join(tempDir, 'load-test.json');
      saveSnapshot(mockResult, snapshotPath);

      const loaded = loadSnapshot(snapshotPath);

      expect(loaded.functionName).toBe('testFunc');
      expect(loaded.references).toHaveLength(2);
      expect(loaded.timestamp).toBeDefined();
      expect(loaded.version).toBe('0.2.0');
    });

    it('should throw if file does not exist', () => {
      expect(() => loadSnapshot('/nonexistent/path.json')).toThrow('Snapshot file not found');
    });

    it('should throw if file contains invalid JSON', () => {
      const badPath = path.join(tempDir, 'bad.json');
      fs.writeFileSync(badPath, 'not json', 'utf-8');

      expect(() => loadSnapshot(badPath)).toThrow('Invalid JSON');
    });

    it('should throw if file is missing required fields', () => {
      const badPath = path.join(tempDir, 'incomplete.json');
      fs.writeFileSync(badPath, JSON.stringify({ foo: 'bar' }), 'utf-8');

      expect(() => loadSnapshot(badPath)).toThrow('Invalid snapshot format');
    });
  });

  describe('diffAnalysis', () => {
    it('should detect added references', () => {
      const snapshotPath = path.join(tempDir, 'prev.json');
      saveSnapshot(mockResult, snapshotPath);
      const previous = loadSnapshot(snapshotPath);

      const current: AnalysisResult = {
        functionName: 'testFunc',
        references: [
          ...mockResult.references,
          makeRef('/src/new-file.ts', 5),
        ],
        count: 3,
      };

      const diff = diffAnalysis(previous, current);

      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].location.filePath).toBe('/src/new-file.ts');
      expect(diff.removed).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(2);
      expect(diff.summary.added).toBe(1);
    });

    it('should detect removed references', () => {
      const snapshotPath = path.join(tempDir, 'prev.json');
      saveSnapshot(mockResult, snapshotPath);
      const previous = loadSnapshot(snapshotPath);

      const current: AnalysisResult = {
        functionName: 'testFunc',
        references: [mockResult.references[0]],
        count: 1,
      };

      const diff = diffAnalysis(previous, current);

      expect(diff.removed).toHaveLength(1);
      expect(diff.removed[0].location.filePath).toBe('/src/utils.ts');
      expect(diff.added).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(1);
      expect(diff.summary.removed).toBe(1);
    });

    it('should show all unchanged when data is identical', () => {
      const snapshotPath = path.join(tempDir, 'prev.json');
      saveSnapshot(mockResult, snapshotPath);
      const previous = loadSnapshot(snapshotPath);

      const diff = diffAnalysis(previous, mockResult);

      expect(diff.added).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(2);
      expect(diff.summary).toEqual({ added: 0, removed: 0, unchanged: 2 });
    });
  });

  describe('formatDiff', () => {
    it('should produce readable output with added and removed sections', () => {
      const diff: DiffResult = {
        functionName: 'myFunc',
        added: [makeRef('/src/new.ts', 3)],
        removed: [makeRef('/src/old.ts', 7)],
        unchanged: [makeRef('/src/stable.ts', 10)],
        summary: { added: 1, removed: 1, unchanged: 1 },
      };

      const output = formatDiff(diff);

      expect(output).toContain('Analysis Diff: myFunc');
      expect(output).toContain('+ 1 new reference(s)');
      expect(output).toContain('- 1 removed reference(s)');
      expect(output).toContain('= 1 unchanged reference(s)');
      expect(output).toContain('Added:');
      expect(output).toContain('/src/new.ts:3');
      expect(output).toContain('Removed:');
      expect(output).toContain('/src/old.ts:7');
    });

    it('should omit Added section when there are no additions', () => {
      const diff: DiffResult = {
        functionName: 'myFunc',
        added: [],
        removed: [],
        unchanged: [makeRef('/src/stable.ts', 10)],
        summary: { added: 0, removed: 0, unchanged: 1 },
      };

      const output = formatDiff(diff);

      expect(output).not.toContain('Added:');
      expect(output).not.toContain('Removed:');
      expect(output).toContain('= 1 unchanged reference(s)');
    });
  });
});
