#!/usr/bin/env node

import { ContextPacker } from '../lib/context-packer';
import { formatForLLM, formatAsText } from '../lib/formatter';
import { exportAs } from '../lib/exporter';
import { loadConfig, ContextPackerConfig } from '../lib/config-loader';
import { MultiFunctionAnalyzer, formatMultiAnalysis } from '../lib/multi-function-analyzer';
import { ContextDepth } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import clipboardy from 'clipboardy';
import open from 'open';

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Context Packer for AI - Find and extract function usage context

USAGE:
  context-packer <function-name> [options]
  context-packer <func1,func2,...> [options]  (multi-function analysis)

ARGUMENTS:
  <function-name>     The name of the function to analyze
                      Use comma-separated names for multiple functions (no spaces)

OPTIONS:
  --dir <path>        Root directory to search (default: current directory)
  --depth <level>     Context depth: snippet|logic|module (default: logic)
  --output <file>     Write output to file instead of stdout
  --format <type>     Output format: markdown|text|json|csv|txt|xml (default: markdown)
  --include <pattern> File patterns to include (can be specified multiple times)
  --exclude <pattern> File patterns to exclude (can be specified multiple times)
  --copy              Copy output to clipboard
  --open-ai <service> Open AI assistant: chatgpt|claude|gemini
  --help, -h          Show this help message
  --wizard, -w        Run interactive setup wizard

CONFIGURATION:
  Context Packer looks for .contextpackerrc.json in the current directory
  for default settings. CLI flags override config file settings.
  
  Example config file:
  {
    "defaultDepth": "logic",
    "defaultFormat": "markdown",
    "exclude": ["**/node_modules/**", "**/dist/**"],
    "autoCopy": false,
    "preferredAI": "chatgpt"
  }

AI ASSISTANTS:
  chatgpt - Opens ChatGPT (https://chat.openai.com)
  claude  - Opens Claude (https://claude.ai)
  gemini  - Opens Gemini (https://gemini.google.com)

EXPORT FORMATS:
  markdown  - LLM-optimized markdown with code blocks (default)
  text      - Plain text with formatting
  json      - Structured JSON data
  csv       - Comma-separated values for spreadsheets
  txt       - Simple plain text without formatting
  xml       - XML structured format

EXAMPLES:
  # Find all references to 'handleSubmit' with logic context
  context-packer handleSubmit

  # Analyze multiple functions at once
  context-packer validateUser,hashPassword,processData

  # Search in specific directory with snippet view
  context-packer handleSubmit --dir ./src --depth snippet

  # Save full module context to a file
  context-packer processData --depth module --output context.md

  # Auto-copy and open AI assistant
  context-packer myFunc --copy --open-ai chatgpt

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
  depth?: ContextDepth;
  output?: string;
  format?: 'markdown' | 'text' | 'json' | 'csv' | 'txt' | 'xml';
  include: string[];
  exclude: string[];
  help: boolean;
  wizard: boolean;
  copy?: boolean;
  openAI?: 'chatgpt' | 'claude' | 'gemini';
} {
  const result: any = {
    dir: process.cwd(),
    include: [] as string[],
    exclude: [] as string[],
    help: false,
    wizard: false,
  };

  let functionName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--wizard' || arg === '-w') {
      result.wizard = true;
    } else if (arg === '--dir') {
      const value = args[++i];
      if (!value) {
        console.error('Error: --dir requires a directory path');
        process.exit(1);
      }
      result.dir = path.resolve(value);
    } else if (arg === '--depth') {
      const depth = args[++i];
      if (!depth) {
        console.error('Error: --depth requires a value (snippet, logic, or module)');
        process.exit(1);
      }
      if (!['snippet', 'logic', 'module'].includes(depth)) {
        console.error(`Error: Invalid depth '${depth}'. Must be snippet, logic, or module.`);
        process.exit(1);
      }
      result.depth = depth as ContextDepth;
    } else if (arg === '--output') {
      const value = args[++i];
      if (!value) {
        console.error('Error: --output requires a file path');
        process.exit(1);
      }
      (result as any).output = value;
    } else if (arg === '--format') {
      const format = args[++i];
      if (!format) {
        console.error('Error: --format requires a value (markdown, text, json, csv, txt, or xml)');
        process.exit(1);
      }
      if (!['markdown', 'text', 'json', 'csv', 'txt', 'xml'].includes(format)) {
        console.error(`Error: Invalid format '${format}'. Must be markdown, text, json, csv, txt, or xml.`);
        process.exit(1);
      }
      result.format = format as 'markdown' | 'text' | 'json' | 'csv' | 'txt' | 'xml';
    } else if (arg === '--include') {
      const value = args[++i];
      if (!value) {
        console.error('Error: --include requires a glob pattern');
        process.exit(1);
      }
      result.include.push(value);
    } else if (arg === '--exclude') {
      const value = args[++i];
      if (!value) {
        console.error('Error: --exclude requires a glob pattern');
        process.exit(1);
      }
      result.exclude.push(value);
    } else if (arg === '--copy') {
      result.copy = true;
    } else if (arg === '--open-ai') {
      const service = args[++i];
      if (!service) {
        console.error('Error: --open-ai requires a service name (chatgpt, claude, or gemini)');
        process.exit(1);
      }
      if (!['chatgpt', 'claude', 'gemini'].includes(service)) {
        console.error(`Error: Invalid AI service '${service}'. Must be chatgpt, claude, or gemini.`);
        process.exit(1);
      }
      (result as any).openAI = service;
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
 * Interactive setup wizard
 */
function runWizard() {
  console.log('\n🧙 Context Packer Setup Wizard\n');
  console.log('Welcome! Let me help you get started with Context Packer.');
  console.log('Here are some common use cases and example commands:\n');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 Use Case 1: Quick Function Reference Check');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Find where a function is called (just the lines):');
  console.log('\n  context-packer myFunction --depth snippet\n');
  console.log('Example output: Shows just the line of code where myFunction is called');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 Use Case 2: Understanding Function Usage (RECOMMENDED)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('See how a function is used with full context:');
  console.log('\n  context-packer myFunction --depth logic\n');
  console.log('Example output: Shows the entire function where myFunction is called');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 Use Case 3: Auto-Copy and Open AI Assistant');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Automatically copy to clipboard and open AI assistant:');
  console.log('\n  context-packer myFunction --copy --open-ai chatgpt\n');
  console.log('Available AI assistants: chatgpt, claude, gemini');
  console.log('The context is copied to your clipboard and ready to paste!');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔢 Use Case 4: Analyze Multiple Functions (NEW!)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Analyze several functions at once:');
  console.log('\n  context-packer validateUser,hashPassword,processData\n');
  console.log('Example output: Shows usage context for all three functions');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('⚙️  Use Case 5: Use Config File (NEW!)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Create .contextpackerrc.json with your preferences:');
  console.log(`
  {
    "defaultDepth": "logic",
    "defaultFormat": "markdown",
    "exclude": ["**/node_modules/**"],
    "autoCopy": true,
    "preferredAI": "claude"
  }
  `);
  console.log('Then just run: context-packer myFunction');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📄 Use Case 6: Save Context to File');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Save function context to share later:');
  console.log('\n  context-packer myFunction --output context.md\n');
  console.log('Then paste context.md into your AI assistant');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Use Case 7: Export as JSON for Tools');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Export structured data for programmatic analysis:');
  console.log('\n  context-packer myFunction --format json --output data.json\n');
  console.log('Formats available: json, csv, xml, txt, markdown, text');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📁 Use Case 8: Search Specific Directory');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Focus your search on a specific module:');
  console.log('\n  context-packer myFunction --dir ./src/components\n');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎯 Use Case 9: Exclude Test Files');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Skip test files in your analysis:');
  console.log('\n  context-packer myFunction --exclude "**/*.test.ts"\n');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Quick Start Commands');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Basic usage:         context-packer <functionName>');
  console.log('Multiple functions:  context-packer <func1,func2,func3>');
  console.log('With directory:      context-packer <functionName> --dir ./src');
  console.log('Copy to clipboard:   context-packer <functionName> --copy');
  console.log('Open ChatGPT:        context-packer <functionName> --copy --open-ai chatgpt');
  console.log('Save to file:        context-packer <functionName> --output out.md');
  console.log('Export as JSON:      context-packer <functionName> --format json');
  console.log('Full module context: context-packer <functionName> --depth module');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📚 More Help');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Full help:    context-packer --help');
  console.log('Quick start:  cat QUICKSTART.md');
  console.log('Usage guide:  cat USAGE.md');
  console.log('');
  
  console.log('Try running one of the commands above! 🎉\n');
}

/**
 * Main CLI function
 */
export function main() {
  const args = process.argv.slice(2);
  
  // Load config file if it exists
  const fileConfig = loadConfig(process.cwd());
  
  // Parse CLI arguments
  const cliArgs = parseArgs(args);
  
  // Derive effective options, honoring config defaults when CLI flags are absent
  const effectiveDepth = cliArgs.depth !== undefined ? cliArgs.depth : (fileConfig.defaultDepth as ContextDepth) || ContextDepth.LOGIC;
  const effectiveFormat = cliArgs.format !== undefined ? cliArgs.format : (fileConfig.defaultFormat as any) || 'markdown';
  const effectiveCopy = cliArgs.copy !== undefined ? cliArgs.copy : fileConfig.autoCopy || false;
  const effectiveOpenAI = cliArgs.openAI !== undefined ? cliArgs.openAI : (fileConfig.preferredAI as any);
  
  // Merge config file with CLI arguments (CLI takes precedence)
  const fullConfig: ContextPackerConfig & typeof cliArgs & { depth: ContextDepth; format: any; copy: boolean } = {
    ...fileConfig,
    ...cliArgs,
    depth: effectiveDepth,
    format: effectiveFormat,
    copy: effectiveCopy,
    openAI: effectiveOpenAI,
    // Ensure include/exclude arrays are properly merged
    include: cliArgs.include.length > 0 ? cliArgs.include : fileConfig.include || [],
    exclude: cliArgs.exclude.length > 0 ? cliArgs.exclude : fileConfig.exclude || [],
  };

  if (fullConfig.help || (!fullConfig.functionName && !fullConfig.wizard)) {
    printUsage();
    process.exit(fullConfig.help ? 0 : 1);
  }
  
  if (fullConfig.wizard) {
    runWizard();
    process.exit(0);
  }

  const functionName = fullConfig.functionName!;

  // Check if directory exists
  if (!fs.existsSync(fullConfig.dir)) {
    console.error(`Error: Directory '${fullConfig.dir}' does not exist.`);
    process.exit(1);
  }

  // Check if this is a multi-function analysis
  if (MultiFunctionAnalyzer.isMultiFunction(functionName)) {
    console.error(`Analyzing multiple functions: ${functionName}`);
    console.error(`Search directory: ${fullConfig.dir}`);
    console.error(`Context depth: ${fullConfig.depth}`);
    console.error('');

    // Create context packer
    const packer = new ContextPacker({
      rootDir: fullConfig.dir,
      depth: fullConfig.depth!,
      include: fullConfig.include.length > 0 ? fullConfig.include : undefined,
      exclude: fullConfig.exclude.length > 0 ? fullConfig.exclude : undefined,
    });

    // Create multi-function analyzer
    const analyzer = new MultiFunctionAnalyzer(packer);

    // Parse function names and analyze
    const functionNames = MultiFunctionAnalyzer.parseFunctionList(functionName);
    const result = analyzer.analyze(functionNames);

    console.error(`Analyzed ${result.summary.functionCount} functions`);
    console.error(`Total references: ${result.summary.totalMatches}`);
    console.error('');

    // Format the output
    let output: string;
    if (fullConfig.format === 'markdown') {
      output = formatMultiAnalysis(result, 'markdown', fullConfig.dir);
    } else if (fullConfig.format === 'text') {
      output = formatMultiAnalysis(result, 'text', fullConfig.dir);
    } else if (fullConfig.format === 'json') {
      output = formatMultiAnalysis(result, 'json', fullConfig.dir);
    } else {
      // For other formats, use JSON for now
      output = formatMultiAnalysis(result, 'json', fullConfig.dir);
    }

    // Write or print output
    if ((fullConfig as any).output) {
      fs.writeFileSync((fullConfig as any).output, output, 'utf-8');
      console.error(`Output written to: ${(fullConfig as any).output}`);
    } else {
      console.log(output);
    }

    // Copy to clipboard if requested
    if (fullConfig.copy) {
      try {
        clipboardy.writeSync(output);
        console.error('✅ Output copied to clipboard!');
      } catch (error) {
        console.error('⚠️  Failed to copy to clipboard:', error);
      }
    }

    // Open AI assistant if requested
    if (fullConfig.openAI) {
      openAIAssistant(fullConfig.openAI, fullConfig.copy);
    }
  } else {
    // Single function analysis
    console.error(`Analyzing function: ${functionName}`);
    console.error(`Search directory: ${fullConfig.dir}`);
    console.error(`Context depth: ${fullConfig.depth}`);
    console.error('');

    // Create context packer
    const packer = new ContextPacker({
      rootDir: fullConfig.dir,
      depth: fullConfig.depth!,
      include: fullConfig.include.length > 0 ? fullConfig.include : undefined,
      exclude: fullConfig.exclude.length > 0 ? fullConfig.exclude : undefined,
    });

    // Analyze the function
    const result = packer.analyze(functionName);

    console.error(`Found ${result.count} reference(s)`);
    console.error('');

    // Format the output
    let output: string;
    if (fullConfig.format === 'markdown') {
      output = formatForLLM(result, fullConfig.dir);
    } else if (fullConfig.format === 'text') {
      output = formatAsText(result, fullConfig.dir);
    } else {
      // Use the new exporter for json, csv, txt, xml
      output = exportAs(fullConfig.format!, result, fullConfig.dir);
    }

    // Write or print output
    if ((fullConfig as any).output) {
      fs.writeFileSync((fullConfig as any).output, output, 'utf-8');
      console.error(`Output written to: ${(fullConfig as any).output}`);
    } else {
      console.log(output);
    }

    // Copy to clipboard if requested
    if (fullConfig.copy) {
      try {
        clipboardy.writeSync(output);
        console.error('✅ Output copied to clipboard!');
      } catch (error) {
        console.error('⚠️  Failed to copy to clipboard:', error);
      }
    }

    // Open AI assistant if requested
    if (fullConfig.openAI) {
      openAIAssistant(fullConfig.openAI, fullConfig.copy!);
    }
  }
}

/**
 * Open AI assistant in browser
 */
function openAIAssistant(service: 'chatgpt' | 'claude' | 'gemini', copied: boolean) {
  const aiUrls = {
    chatgpt: 'https://chat.openai.com',
    claude: 'https://claude.ai',
    gemini: 'https://gemini.google.com',
  };

  const url = aiUrls[service];
  const serviceName = service.charAt(0).toUpperCase() + service.slice(1);
  
  console.error(`🚀 Opening ${serviceName}...`);
  
  (async () => {
    try {
      await open(url);
      console.error(`✅ ${serviceName} opened in browser`);
      if (copied) {
        console.error('💡 Tip: The context is already in your clipboard - just paste it!');
      }
    } catch (error) {
      console.error(`⚠️  Failed to open browser:`, error);
      console.error(`   You can manually visit: ${url}`);
    }
  })();
}

// Run CLI if this is the main module
if (require.main === module) {
  main();
}
