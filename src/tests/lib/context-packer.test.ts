import { describe, it, expect } from 'vitest';
import { ContextPacker, createContextPacker } from '../../lib/context-packer';
import { ContextDepth } from '../../types';
import * as path from 'path';

describe('context-packer', () => {
  const fixturesPath = path.join(__dirname, '../fixtures');

  describe('ContextPacker', () => {
    it('should create instance with valid options', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.LOGIC,
      });

      expect(packer).toBeInstanceOf(ContextPacker);
    });

    it('should use default options when not provided', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
      });

      expect(packer).toBeDefined();
    });
  });

  describe('analyze', () => {
    it('should analyze function and return results', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
      });

      const result = packer.analyze('testFunction');

      expect(result).toHaveProperty('functionName', 'testFunction');
      expect(result).toHaveProperty('references');
      expect(result).toHaveProperty('count');
      expect(Array.isArray(result.references)).toBe(true);
      expect(result.count).toBe(result.references.length);
    });

    it('should find references across multiple files', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.LOGIC,
      });

      const result = packer.analyze('testFunction');

      expect(result.count).toBeGreaterThan(0);
      expect(result.references.length).toBeGreaterThan(0);
    });

    it('should return empty results for non-existent function', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
      });

      const result = packer.analyze('nonExistentFunction123');

      expect(result.functionName).toBe('nonExistentFunction123');
      expect(result.count).toBe(0);
      expect(result.references).toEqual([]);
    });

    it('should respect include patterns', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
        include: ['**/sample.ts'],
      });

      const result = packer.analyze('testFunction');

      expect(result.count).toBeGreaterThan(0);
      // All references should be from sample.ts
      result.references.forEach((ref) => {
        expect(ref.location.filePath).toContain('sample.ts');
      });
    });

    it('should respect exclude patterns', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
        exclude: ['**/utility.ts'],
      });

      const result = packer.analyze('utilityFunction');

      // Should not find references in utility.ts (which is excluded)
      // or find 0 if utilityFunction is only in utility.ts
      result.references.forEach((ref) => {
        expect(ref.location.filePath).not.toContain('utility.ts');
      });
    });
  });

  describe('analyzeFile', () => {
    it('should analyze specific file only', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.LOGIC,
      });

      const sampleFile = path.join(fixturesPath, 'sample.ts');
      const result = packer.analyzeFile('testFunction', sampleFile);

      expect(result.functionName).toBe('testFunction');
      expect(result.count).toBeGreaterThan(0);
      
      // All references should be from the specified file
      result.references.forEach((ref) => {
        expect(ref.location.filePath).toBe(sampleFile);
      });
    });

    it('should return empty for file without references', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
      });

      const utilityFile = path.join(fixturesPath, 'utility.ts');
      const result = packer.analyzeFile('testFunction', utilityFile);

      expect(result.count).toBe(0);
      expect(result.references).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return statistics about scanned files', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.LOGIC,
      });

      const stats = packer.getStats();

      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('supportedFiles');
      expect(stats.totalFiles).toBeGreaterThan(0);
      expect(stats.supportedFiles).toBeGreaterThan(0);
    });

    it('should count fixture files correctly', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
      });

      const stats = packer.getStats();

      // We have at least sample.ts and utility.ts
      expect(stats.totalFiles).toBeGreaterThanOrEqual(2);
    });
  });

  describe('createContextPacker', () => {
    it('should create packer with default depth', () => {
      const packer = createContextPacker(fixturesPath);

      expect(packer).toBeInstanceOf(ContextPacker);
      
      const result = packer.analyze('testFunction');
      expect(result).toBeDefined();
      expect(result.references.length).toBeGreaterThan(0);
      // Default depth should be LOGIC
      expect(result.references[0].depth).toBe(ContextDepth.LOGIC);
    });

    it('should create packer with custom depth', () => {
      const packer = createContextPacker(fixturesPath, ContextDepth.SNIPPET);

      const result = packer.analyze('testFunction');
      expect(result.references[0].depth).toBe(ContextDepth.SNIPPET);
    });
  });
});
