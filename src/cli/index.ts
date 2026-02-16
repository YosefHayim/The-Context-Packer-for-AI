#!/usr/bin/env node

import { ContextPacker } from '../lib/context-packer';
import { formatForLLM, formatAsText } from '../lib/formatter';
import { ContextDepth } from '../types';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Context Packer for AI - Find and extract function usage context

USAGE:
  context-packer <function-name> [options]

ARGUMENTS:
  <function-name>     The name of the function to analyze

OPTIONS:
  --dir <path>        Root directory to search (default: current directory)
  --depth <level>     Context depth: snippet|logic|module (default: logic)
  --output <file>     Write output to file instead of stdout
  --format <type>     Output format: markdown|text (default: markdown)
  --include <pattern> File patterns to include (can be specified multiple times)
  --exclude <pattern> File patterns to exclude (can be specified multiple times)
  --help, -h          Show this help message

EXAMPLES:
  # Find all references to 'handleSubmit' with logic context
  context-packer handleSubmit

  # Search in specific directory with snippet view
  context-packer handleSubmit --dir ./src --depth snippet

  # Save full module context to a file
  context-packer processData --depth module --output context.md

  # Custom file patterns
  context-packer myFunc --include "**/*.ts" --exclude "**/test/**"

CONTEXT DEPTHS:
  snippet  - Just the line where the function is called
  logic    - The enclosing function/scope containing the call
  module   - The entire file containing the call
`);
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): {
  functionName?: string;
  dir: string;
  depth: ContextDepth;
  output?: string;
  format: 'markdown' | 'text';
  include: string[];
  exclude: string[];
  help: boolean;
} {
  const result = {
    dir: process.cwd(),
    depth: ContextDepth.LOGIC,
    format: 'markdown' as 'markdown' | 'text',
    include: [] as string[],
    exclude: [] as string[],
    help: false,
  };

  let functionName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--dir') {
      result.dir = path.resolve(args[++i]);
    } else if (arg === '--depth') {
      const depth = args[++i];
      if (!['snippet', 'logic', 'module'].includes(depth)) {
        console.error(`Error: Invalid depth '${depth}'. Must be snippet, logic, or module.`);
        process.exit(1);
      }
      result.depth = depth as ContextDepth;
    } else if (arg === '--output') {
      (result as any).output = args[++i];
    } else if (arg === '--format') {
      const format = args[++i];
      if (!['markdown', 'text'].includes(format)) {
        console.error(`Error: Invalid format '${format}'. Must be markdown or text.`);
        process.exit(1);
      }
      result.format = format as 'markdown' | 'text';
    } else if (arg === '--include') {
      result.include.push(args[++i]);
    } else if (arg === '--exclude') {
      result.exclude.push(args[++i]);
    } else if (!arg.startsWith('-')) {
      functionName = arg;
    } else {
      console.error(`Error: Unknown option '${arg}'`);
      process.exit(1);
    }
  }

  return { ...result, functionName };
}

/**
 * Main CLI function
 */
export function main() {
  const args = process.argv.slice(2);
  const config = parseArgs(args);

  if (config.help || !config.functionName) {
    printUsage();
    process.exit(config.help ? 0 : 1);
  }

  const functionName = config.functionName!;

  // Check if directory exists
  if (!fs.existsSync(config.dir)) {
    console.error(`Error: Directory '${config.dir}' does not exist.`);
    process.exit(1);
  }

  console.error(`Analyzing function: ${functionName}`);
  console.error(`Search directory: ${config.dir}`);
  console.error(`Context depth: ${config.depth}`);
  console.error('');

  // Create context packer
  const packer = new ContextPacker({
    rootDir: config.dir,
    depth: config.depth,
    include: config.include.length > 0 ? config.include : undefined,
    exclude: config.exclude.length > 0 ? config.exclude : undefined,
  });

  // Analyze the function
  const result = packer.analyze(functionName);

  console.error(`Found ${result.count} reference(s)`);
  console.error('');

  // Format the output
  const output =
    config.format === 'markdown'
      ? formatForLLM(result, config.dir)
      : formatAsText(result, config.dir);

  // Write or print output
  if (config.output) {
    fs.writeFileSync(config.output, output, 'utf-8');
    console.error(`Output written to: ${config.output}`);
  } else {
    console.log(output);
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main();
}
