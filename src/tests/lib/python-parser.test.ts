import { describe, it, expect } from 'vitest';
import {
  parsePythonFile,
  findPythonReferences,
  getPythonFileContent,
  findPythonEnclosingScope,
} from '../../lib/python-parser';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('python-parser', () => {
  const fixturesPath = path.join(__dirname, '../fixtures');
  const sampleFile = path.join(fixturesPath, 'sample.py');

  describe('getPythonFileContent', () => {
    it('should read Python file content', () => {
      const content = getPythonFileContent(sampleFile);
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('def greet');
    });

    it('should throw for non-existent file', () => {
      expect(() => getPythonFileContent('/nonexistent/file.py')).toThrow(
        'Failed to read Python file'
      );
    });
  });

  describe('parsePythonFile', () => {
    it('should find top-level function definitions', () => {
      const ast = parsePythonFile(sampleFile);
      expect(ast.functions.length).toBe(2);

      const greet = ast.functions.find((f) => f.name === 'greet');
      expect(greet).toBeDefined();
      expect(greet!.startLine).toBe(1);
      expect(greet!.indentLevel).toBe(0);

      const main = ast.functions.find((f) => f.name === 'main');
      expect(main).toBeDefined();
      expect(main!.startLine).toBe(13);
    });

    it('should find class definitions with methods', () => {
      const ast = parsePythonFile(sampleFile);
      expect(ast.classes.length).toBe(1);

      const calc = ast.classes[0];
      expect(calc.name).toBe('Calculator');
      expect(calc.startLine).toBe(6);
      expect(calc.methods.length).toBe(2);

      const methodNames = calc.methods.map((m) => m.name);
      expect(methodNames).toContain('add');
      expect(methodNames).toContain('subtract');
    });

    it('should return empty AST for non-existent file', () => {
      const ast = parsePythonFile('/nonexistent/file.py');
      expect(ast.functions).toEqual([]);
      expect(ast.classes).toEqual([]);
    });

    it('should handle empty file', () => {
      const tmpFile = path.join(os.tmpdir(), `empty-${Date.now()}.py`);
      fs.writeFileSync(tmpFile, '');
      try {
        const ast = parsePythonFile(tmpFile);
        expect(ast.functions).toEqual([]);
        expect(ast.classes).toEqual([]);
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });
  });

  describe('findPythonReferences', () => {
    it('should find function call sites', () => {
      const refs = findPythonReferences(sampleFile, 'greet');
      expect(refs.length).toBe(1);
      expect(refs[0].line).toBe(14);
      expect(refs[0].filePath).toBe(sampleFile);
      expect(refs[0].column).toBeGreaterThanOrEqual(0);
    });

    it('should find print call sites', () => {
      const refs = findPythonReferences(sampleFile, 'print');
      expect(refs.length).toBe(2);

      const lines = refs.map((r) => r.line);
      expect(lines).toContain(3);
      expect(lines).toContain(17);
    });

    it('should return empty array for non-existent file', () => {
      const refs = findPythonReferences('/nonexistent/file.py', 'greet');
      expect(refs).toEqual([]);
    });

    it('should not include the function definition as a reference', () => {
      const refs = findPythonReferences(sampleFile, 'greet');
      const defLine = refs.find((r) => r.line === 1);
      expect(defLine).toBeUndefined();
    });
  });

  describe('findPythonEnclosingScope', () => {
    it('should find enclosing function for an indented line', () => {
      const scope = findPythonEnclosingScope(sampleFile, 2);
      expect(scope).toBe('greet');
    });

    it('should find enclosing class for a method line', () => {
      const scope = findPythonEnclosingScope(sampleFile, 8);
      expect(scope).toBe('add');
    });

    it('should return undefined for top-level code', () => {
      const scope = findPythonEnclosingScope(sampleFile, 1);
      expect(scope).toBeUndefined();
    });

    it('should return undefined for out-of-range line', () => {
      const scope = findPythonEnclosingScope(sampleFile, 9999);
      expect(scope).toBeUndefined();
    });

    it('should return undefined for non-existent file', () => {
      const scope = findPythonEnclosingScope('/nonexistent/file.py', 1);
      expect(scope).toBeUndefined();
    });

    it('should find enclosing function for code inside main', () => {
      const scope = findPythonEnclosingScope(sampleFile, 14);
      expect(scope).toBe('main');
    });
  });
});
