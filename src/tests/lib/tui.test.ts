import { describe, it, expect } from 'vitest';
import { parseInteractiveCommand, startInteractiveMode } from '../../lib/tui';
import type { TUIOptions, ParsedCommand } from '../../lib/tui';
import { ContextDepth } from '../../types';

describe('TUI Module', () => {
  describe('exports', () => {
    it('should export startInteractiveMode as a function', () => {
      expect(typeof startInteractiveMode).toBe('function');
    });

    it('should export parseInteractiveCommand as a function', () => {
      expect(typeof parseInteractiveCommand).toBe('function');
    });
  });

  describe('TUIOptions interface', () => {
    it('should allow constructing a valid TUIOptions object', () => {
      const options: TUIOptions = {
        rootDir: '/tmp/test',
        depth: ContextDepth.LOGIC,
        include: ['**/*.ts'],
        exclude: ['node_modules'],
      };

      expect(options.rootDir).toBe('/tmp/test');
      expect(options.depth).toBe(ContextDepth.LOGIC);
      expect(options.include).toEqual(['**/*.ts']);
      expect(options.exclude).toEqual(['node_modules']);
    });

    it('should allow optional include and exclude', () => {
      const options: TUIOptions = {
        rootDir: '.',
        depth: ContextDepth.SNIPPET,
      };

      expect(options.include).toBeUndefined();
      expect(options.exclude).toBeUndefined();
    });
  });

  describe('parseInteractiveCommand', () => {
    it('should return empty for blank input', () => {
      const result: ParsedCommand = parseInteractiveCommand('');
      expect(result).toEqual({ type: 'empty' });
    });

    it('should return empty for whitespace-only input', () => {
      expect(parseInteractiveCommand('   ')).toEqual({ type: 'empty' });
      expect(parseInteractiveCommand('\t')).toEqual({ type: 'empty' });
    });

    it('should return quit for "quit"', () => {
      expect(parseInteractiveCommand('quit')).toEqual({ type: 'quit' });
    });

    it('should return quit for "exit"', () => {
      expect(parseInteractiveCommand('exit')).toEqual({ type: 'quit' });
    });

    it('should return quit for "q"', () => {
      expect(parseInteractiveCommand('q')).toEqual({ type: 'quit' });
    });

    it('should return help for "help"', () => {
      expect(parseInteractiveCommand('help')).toEqual({ type: 'help' });
    });

    it('should return stats for "stats"', () => {
      expect(parseInteractiveCommand('stats')).toEqual({ type: 'stats' });
    });

    it('should return multi for comma-separated input', () => {
      expect(parseInteractiveCommand('foo,bar')).toEqual({
        type: 'multi',
        value: 'foo,bar',
      });
    });

    it('should return multi for comma-separated input with spaces', () => {
      expect(parseInteractiveCommand('  foo, bar, baz  ')).toEqual({
        type: 'multi',
        value: 'foo, bar, baz',
      });
    });

    it('should return analyze for a single function name', () => {
      expect(parseInteractiveCommand('handleSubmit')).toEqual({
        type: 'analyze',
        value: 'handleSubmit',
      });
    });

    it('should trim whitespace from function names', () => {
      expect(parseInteractiveCommand('  myFunc  ')).toEqual({
        type: 'analyze',
        value: 'myFunc',
      });
    });

    it('should handle quit commands with surrounding whitespace', () => {
      expect(parseInteractiveCommand('  quit  ')).toEqual({ type: 'quit' });
      expect(parseInteractiveCommand('  exit  ')).toEqual({ type: 'quit' });
      expect(parseInteractiveCommand('  q  ')).toEqual({ type: 'quit' });
    });
  });
});
