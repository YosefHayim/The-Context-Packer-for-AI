#!/usr/bin/env node

import { ContextPacker } from '../lib/context-packer';
import { formatForLLM, formatAsText } from '../lib/formatter';
import { exportAs } from '../lib/exporter';
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

ARGUMENTS:
  <function-name>     The name of the function to analyze

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
  format: 'markdown' | 'text' | 'json' | 'csv' | 'txt' | 'xml';
  include: string[];
  exclude: string[];
  help: boolean;
  wizard: boolean;
  copy: boolean;
  openAI?: 'chatgpt' | 'claude' | 'gemini';
} {
  const result = {
    dir: process.cwd(),
    depth: ContextDepth.LOGIC,
    format: 'markdown' as 'markdown' | 'text' | 'json' | 'csv' | 'txt' | 'xml',
    include: [] as string[],
    exclude: [] as string[],
    help: false,
    wizard: false,
    copy: false,
  };

  let functionName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--wizard' || arg === '-w') {
      result.wizard = true;
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
      if (!['markdown', 'text', 'json', 'csv', 'txt', 'xml'].includes(format)) {
        console.error(`Error: Invalid format '${format}'. Must be markdown, text, json, csv, txt, or xml.`);
        process.exit(1);
      }
      result.format = format as 'markdown' | 'text' | 'json' | 'csv' | 'txt' | 'xml';
    } else if (arg === '--include') {
      result.include.push(args[++i]);
    } else if (arg === '--exclude') {
      result.exclude.push(args[++i]);
    } else if (arg === '--copy') {
      result.copy = true;
    } else if (arg === '--open-ai') {
      const service = args[++i];
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
  console.log('🤖 Use Case 3: Auto-Copy and Open AI Assistant (NEW!)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Automatically copy to clipboard and open AI assistant:');
  console.log('\n  context-packer myFunction --copy --open-ai chatgpt\n');
  console.log('Available AI assistants: chatgpt, claude, gemini');
  console.log('The context is copied to your clipboard and ready to paste!');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📄 Use Case 4: Save Context to File');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Save function context to share later:');
  console.log('\n  context-packer myFunction --output context.md\n');
  console.log('Then paste context.md into your AI assistant');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Use Case 5: Export as JSON for Tools');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Export structured data for programmatic analysis:');
  console.log('\n  context-packer myFunction --format json --output data.json\n');
  console.log('Formats available: json, csv, xml, txt, markdown, text');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📁 Use Case 6: Search Specific Directory');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Focus your search on a specific module:');
  console.log('\n  context-packer myFunction --dir ./src/components\n');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎯 Use Case 7: Exclude Test Files');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Skip test files in your analysis:');
  console.log('\n  context-packer myFunction --exclude "**/*.test.ts"\n');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Quick Start Commands');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Basic usage:         context-packer <functionName>');
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
  const config = parseArgs(args);

  if (config.help || (!config.functionName && !config.wizard)) {
    printUsage();
    process.exit(config.help ? 0 : 1);
  }
  
  if (config.wizard) {
    runWizard();
    process.exit(0);
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
  let output: string;
  if (config.format === 'markdown') {
    output = formatForLLM(result, config.dir);
  } else if (config.format === 'text') {
    output = formatAsText(result, config.dir);
  } else {
    // Use the new exporter for json, csv, txt, xml
    output = exportAs(config.format, result, config.dir);
  }

  // Write or print output
  if (config.output) {
    fs.writeFileSync(config.output, output, 'utf-8');
    console.error(`Output written to: ${config.output}`);
  } else {
    console.log(output);
  }

  // Copy to clipboard if requested
  if (config.copy) {
    try {
      clipboardy.writeSync(output);
      console.error('✅ Output copied to clipboard!');
    } catch (error) {
      console.error('⚠️  Failed to copy to clipboard:', error);
    }
  }

  // Open AI assistant if requested
  if (config.openAI) {
    const aiUrls = {
      chatgpt: 'https://chat.openai.com',
      claude: 'https://claude.ai',
      gemini: 'https://gemini.google.com',
    };

    const aiService = config.openAI;
    const url = aiUrls[aiService];
    const serviceName = aiService.charAt(0).toUpperCase() + aiService.slice(1);
    
    console.error(`🚀 Opening ${serviceName}...`);
    
    (async () => {
      try {
        await open(url);
        console.error(`✅ ${serviceName} opened in browser`);
        if (config.copy) {
          console.error('💡 Tip: The context is already in your clipboard - just paste it!');
        }
      } catch (error) {
        console.error(`⚠️  Failed to open browser:`, error);
        console.error(`   You can manually visit: ${url}`);
      }
    })();
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main();
}
