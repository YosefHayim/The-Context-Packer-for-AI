import * as readline from 'readline';
import { ContextPacker } from './context-packer';
import { formatForLLM } from './formatter';
import { MultiFunctionAnalyzer, formatMultiAnalysis } from './multi-function-analyzer';
import type { ContextPackerOptions } from '../types';

/** Options for the interactive TUI mode — subset of ContextPackerOptions */
export type TUIOptions = Pick<ContextPackerOptions, 'rootDir' | 'depth' | 'include' | 'exclude'>;

/** Parsed interactive command result */
export interface ParsedCommand {
  type: 'analyze' | 'multi' | 'quit' | 'help' | 'stats' | 'empty';
  value?: string;
}

/** Parse user input into a structured command */
export function parseInteractiveCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  if (trimmed === '') {
    return { type: 'empty' };
  }

  if (trimmed === 'quit' || trimmed === 'exit' || trimmed === 'q') {
    return { type: 'quit' };
  }

  if (trimmed === 'help') {
    return { type: 'help' };
  }

  if (trimmed === 'stats') {
    return { type: 'stats' };
  }

  if (trimmed.includes(',')) {
    return { type: 'multi', value: trimmed };
  }

  return { type: 'analyze', value: trimmed };
}

function printBanner(): void {
  process.stderr.write('\n');
  process.stderr.write('╔══════════════════════════════════════════╗\n');
  process.stderr.write('║     Context Packer - Interactive Mode    ║\n');
  process.stderr.write('╚══════════════════════════════════════════╝\n');
  process.stderr.write('\n');
  process.stderr.write('Type a function name to analyze its references.\n');
  process.stderr.write('Type "help" for available commands.\n');
  process.stderr.write('\n');
}

function printHelp(): void {
  process.stderr.write('\nAvailable commands:\n');
  process.stderr.write('  <function-name>       Analyze a single function\n');
  process.stderr.write('  <func1,func2,...>     Analyze multiple functions\n');
  process.stderr.write('  stats                 Show codebase statistics\n');
  process.stderr.write('  help                  Show this help message\n');
  process.stderr.write('  quit / exit / q       Exit interactive mode\n');
  process.stderr.write('\n');
}

/** Start the interactive TUI mode */
export function startInteractiveMode(options: TUIOptions): void {
  const packer = new ContextPacker({
    rootDir: options.rootDir,
    depth: options.depth,
    include: options.include,
    exclude: options.exclude,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  printBanner();

  const prompt = (): void => {
    rl.question('context-packer> ', (input: string) => {
      const command = parseInteractiveCommand(input);

      switch (command.type) {
        case 'empty':
          prompt();
          return;

        case 'quit':
          process.stderr.write('Goodbye!\n');
          rl.close();
          return;

        case 'help':
          printHelp();
          prompt();
          return;

        case 'stats': {
          const stats = packer.getStats();
          process.stderr.write(`\nCodebase Statistics:\n`);
          process.stderr.write(`  Total files:     ${stats.totalFiles}\n`);
          process.stderr.write(`  Supported files: ${stats.supportedFiles}\n`);
          process.stderr.write(`  Depth:           ${options.depth}\n`);
          process.stderr.write(`  Root directory:  ${options.rootDir}\n`);
          process.stderr.write('\n');
          prompt();
          return;
        }

        case 'multi': {
          const names = MultiFunctionAnalyzer.parseFunctionList(command.value!);
          process.stderr.write(`\nAnalyzing ${names.length} functions: ${names.join(', ')}\n`);
          const multiAnalyzer = new MultiFunctionAnalyzer(packer);
          const multiResult = multiAnalyzer.analyze(names);
          const multiOutput = formatMultiAnalysis(multiResult, 'markdown', options.rootDir);
          process.stdout.write(multiOutput);
          process.stderr.write(`\nFound ${multiResult.totalReferences} total references.\n\n`);
          prompt();
          return;
        }

        case 'analyze': {
          const functionName = command.value!;
          process.stderr.write(`\nAnalyzing: ${functionName}\n`);
          const result = packer.analyze(functionName);
          const output = formatForLLM(result, options.rootDir);
          process.stdout.write(output);
          process.stderr.write(`\nFound ${result.count} reference(s).\n\n`);
          prompt();
          return;
        }
      }
    });
  };

  prompt();
}
