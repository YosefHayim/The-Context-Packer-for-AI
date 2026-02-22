#!/usr/bin/env node

import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ContextPacker } from '../lib/context-packer.js';
import { formatForLLM } from '../lib/formatter.js';
import {
  MultiFunctionAnalyzer,
  formatMultiAnalysis,
} from '../lib/multi-function-analyzer.js';
import { ContextDepth } from '../types/index.js';

const server = new McpServer({
  name: 'context-packer',
  version: '0.2.0',
});

server.tool(
  'analyze_function',
  'Analyze a function and find all references across the codebase',
  {
    functionName: z.string().describe('Name of the function to analyze'),
    dir: z
      .string()
      .optional()
      .default('.')
      .describe('Root directory to search'),
    depth: z
      .enum(['snippet', 'logic', 'module'])
      .optional()
      .default('logic')
      .describe('Context depth: snippet, logic, or module'),
  },
  async ({ functionName, dir, depth }) => {
    try {
      const resolvedDir = path.resolve(dir);
      const packer = new ContextPacker({
        rootDir: resolvedDir,
        depth: depth as ContextDepth,
      });
      const result = packer.analyze(functionName);
      const markdown = formatForLLM(result, resolvedDir);
      return { content: [{ type: 'text' as const, text: markdown }] };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  'analyze_multi_function',
  'Analyze multiple functions at once and find all references',
  {
    functionNames: z
      .string()
      .describe('Comma-separated list of function names to analyze'),
    dir: z
      .string()
      .optional()
      .default('.')
      .describe('Root directory to search'),
    depth: z
      .enum(['snippet', 'logic', 'module'])
      .optional()
      .default('logic')
      .describe('Context depth: snippet, logic, or module'),
  },
  async ({ functionNames, dir, depth }) => {
    try {
      const resolvedDir = path.resolve(dir);
      const packer = new ContextPacker({
        rootDir: resolvedDir,
        depth: depth as ContextDepth,
      });
      const names = MultiFunctionAnalyzer.parseFunctionList(functionNames);
      if (names.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Error: No valid function names provided',
            },
          ],
          isError: true,
        };
      }
      const analyzer = new MultiFunctionAnalyzer(packer);
      const result = analyzer.analyze(names);
      const markdown = formatMultiAnalysis(result, 'markdown', resolvedDir);
      return { content: [{ type: 'text' as const, text: markdown }] };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
