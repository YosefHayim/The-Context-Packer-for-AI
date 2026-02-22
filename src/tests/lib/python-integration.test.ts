import { describe, it, expect } from 'vitest';
import { findReferencesInFile, findEnclosingScope } from '../../lib/reference-finder';
import { ContextPacker } from '../../lib/context-packer';
import { ContextDepth } from '../../types';
import * as path from 'path';

const samplePy = path.join(__dirname, '../fixtures/sample.py');
const fixturesPath = path.join(__dirname, '../fixtures');

describe('Python integration', () => {
  describe('findReferencesInFile with Python files', () => {
    it('should find call sites for a Python function', () => {
      const refs = findReferencesInFile(samplePy, 'greet');

      expect(refs).toHaveLength(1);
      expect(refs[0].filePath).toBe(samplePy);
      expect(refs[0].line).toBe(14);
    });

    it('should find call sites for main()', () => {
      const refs = findReferencesInFile(samplePy, 'main');

      expect(refs).toHaveLength(1);
      expect(refs[0].line).toBe(20);
    });

    it('should find method call sites (add)', () => {
      const refs = findReferencesInFile(samplePy, 'add');

      expect(refs).toHaveLength(1);
      expect(refs[0].line).toBe(16);
    });

    it('should return empty array for function with no call sites', () => {
      const refs = findReferencesInFile(samplePy, 'nonExistentFunction');

      expect(refs).toEqual([]);
    });

    it('should not count definitions as references', () => {
      // greet is defined on line 1 and called on line 14
      const refs = findReferencesInFile(samplePy, 'greet');

      refs.forEach((ref) => {
        expect(ref.line).not.toBe(1);
      });
    });
  });

  describe('findEnclosingScope with Python files', () => {
    it('should return enclosing function scope for a Python reference', () => {
      // Line 14 is inside main()
      const scope = findEnclosingScope(samplePy, {
        filePath: samplePy,
        line: 14,
        column: 4,
      });

      expect(scope).not.toBeNull();
      expect(scope!.name).toBe('main');
      expect(scope!.startLine).toBe(13);
      expect(scope!.endLine).toBe(17);
    });

    it('should return method scope for a line inside a class method', () => {
      // Line 8 is inside Calculator.add
      const scope = findEnclosingScope(samplePy, {
        filePath: samplePy,
        line: 8,
        column: 0,
      });

      expect(scope).not.toBeNull();
      expect(scope!.name).toBe('add');
      expect(scope!.startLine).toBe(7);
      expect(scope!.endLine).toBe(8);
    });

    it('should return null for a line outside any scope', () => {
      // Line 20 is in module-level if __name__ block, not inside a function
      const scope = findEnclosingScope(samplePy, {
        filePath: samplePy,
        line: 20,
        column: 0,
      });

      expect(scope).toBeNull();
    });
  });

  describe('ContextPacker.analyze() with Python files', () => {
    it('should analyze Python function references end-to-end', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
        include: ['**/*.py'],
      });

      const result = packer.analyze('greet');

      expect(result.functionName).toBe('greet');
      expect(result.count).toBe(1);
      expect(result.references[0].location.line).toBe(14);
      expect(result.references[0].depth).toBe(ContextDepth.SNIPPET);
    });

    it('should extract LOGIC depth context for Python references', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.LOGIC,
        include: ['**/*.py'],
      });

      const result = packer.analyze('greet');

      expect(result.count).toBe(1);
      expect(result.references[0].enclosingScope).toBe('main');
      expect(result.references[0].context).toContain('greet');
    });

    it('should extract MODULE depth context for Python references', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.MODULE,
        include: ['**/*.py'],
      });

      const result = packer.analyze('greet');

      expect(result.count).toBe(1);
      // Module depth returns entire file content
      expect(result.references[0].context).toContain('def greet');
      expect(result.references[0].context).toContain('class Calculator');
      expect(result.references[0].context).toContain('def main');
    });
  });

  describe('Mixed project (TS + Python) analysis', () => {
    it('should analyze across both TS and Python files', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
        include: ['**/*.ts', '**/*.py'],
      });

      // 'print' exists in Python's sample.py
      const result = packer.analyze('print');

      // Should find Python references without crashing
      const pyRefs = result.references.filter((r) =>
        r.location.filePath.endsWith('.py')
      );
      expect(pyRefs.length).toBeGreaterThan(0);
    });

    it('should not crash when scanning mixed file types', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.LOGIC,
      });

      // This should not throw even though .py files are included
      expect(() => packer.analyze('testFunction')).not.toThrow();
    });
  });
});
