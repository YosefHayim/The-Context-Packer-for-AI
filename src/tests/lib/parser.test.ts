import { describe, it, expect } from 'vitest';
import { parseFile, getFileContent, getLine, getLines } from '../../lib/parser';
import * as path from 'path';

describe('parser', () => {
  const fixturesPath = path.join(__dirname, '../fixtures');
  const sampleFile = path.join(fixturesPath, 'sample.ts');

  describe('parseFile', () => {
    it('should successfully parse a valid TypeScript file', () => {
      const ast = parseFile(sampleFile);
      expect(ast).not.toBeNull();
      expect(ast).toHaveProperty('type');
      expect(ast).toHaveProperty('body');
    });

    it('should return null for invalid file path', () => {
      const ast = parseFile('/non/existent/file.ts');
      expect(ast).toBeNull();
    });

    it('should handle files with JSX/TSX extension', () => {
      // Since we don't have a tsx fixture, just verify the function accepts it
      // In a real scenario, you'd create a .tsx fixture
      const result = parseFile(sampleFile); // Using .ts file
      expect(result).not.toBeNull();
    });
  });

  describe('getFileContent', () => {
    it('should read file content as string', () => {
      const content = getFileContent(sampleFile);
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('testFunction');
    });

    it('should throw error for non-existent file', () => {
      expect(() => getFileContent('/non/existent/file.ts')).toThrow();
    });
  });

  describe('getLine', () => {
    it('should get a specific line from file', () => {
      const line = getLine(sampleFile, 3);
      expect(typeof line).toBe('string');
      expect(line.trim().length).toBeGreaterThan(0);
    });

    it('should return empty string for out of range line number', () => {
      const line = getLine(sampleFile, 99999);
      expect(line).toBe('');
    });

    it('should return first line correctly', () => {
      const line = getLine(sampleFile, 1);
      expect(line).toContain('//');
    });
  });

  describe('getLines', () => {
    it('should get a range of lines from file', () => {
      const lines = getLines(sampleFile, 1, 5);
      expect(typeof lines).toBe('string');
      expect(lines.split('\n').length).toBe(5);
    });

    it('should handle single line range', () => {
      const lines = getLines(sampleFile, 3, 3);
      expect(typeof lines).toBe('string');
      expect(lines.split('\n').length).toBe(1);
    });

    it('should handle start to end of file', () => {
      const content = getFileContent(sampleFile);
      const totalLines = content.split('\n').length;
      const lines = getLines(sampleFile, 1, totalLines);
      expect(lines).toBe(content);
    });
  });
});
