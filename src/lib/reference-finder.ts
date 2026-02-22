import { AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { parseFile } from './parser';
import type { CodeLocation } from '../types';

/**
 * Find all references to a function in a file using AST
 */
export function findReferencesInFile(
  filePath: string,
  functionName: string
): CodeLocation[] {
  const ast = parseFile(filePath);
  if (!ast) {
    return [];
  }

  const references: CodeLocation[] = [];

  /**
   * Walk the AST and find function calls
   */
  function walk(node: TSESTree.Node): void {
    // Check if this is a function call
    if (node.type === AST_NODE_TYPES.CallExpression) {
      let calleeName: string | null = null;

      // Direct function call: functionName()
      if (node.callee.type === AST_NODE_TYPES.Identifier) {
        calleeName = node.callee.name;
      }
      // Method call: obj.functionName()
      else if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
        // Only match non-computed member expressions (obj.prop, not obj[prop])
        if (!node.callee.computed && node.callee.property.type === AST_NODE_TYPES.Identifier) {
          calleeName = node.callee.property.name;
        }
      }

      // If we found a matching function call
      if (calleeName === functionName && node.loc) {
        references.push({
          filePath,
          line: node.loc.start.line,
          column: node.loc.start.column,
        });
      }
    }

    // Recursively walk child nodes
    for (const key in node) {
      const child = (node as any)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          child.forEach((item) => {
            if (item && typeof item === 'object' && item.type) {
              walk(item);
            }
          });
        } else if (child.type) {
          walk(child);
        }
      }
    }
  }

  walk(ast);
  return references;
}

/**
 * Find the enclosing function/scope for a given location
 */
export function findEnclosingScope(
  filePath: string,
  location: CodeLocation
): { name: string; startLine: number; endLine: number } | null {
  const ast = parseFile(filePath);
  if (!ast) {
    return null;
  }

  let enclosing: { name: string; startLine: number; endLine: number } | null = null;

  function walk(node: TSESTree.Node): void {
    if (!node.loc) return;

    // Check if this node contains our location
    if (
      node.loc.start.line <= location.line &&
      node.loc.end.line >= location.line
    ) {
      // Check if it's a function-like node
      if (
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression ||
        node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.MethodDefinition
      ) {
        let name = 'anonymous';

        if ('id' in node && node.id && node.id.type === AST_NODE_TYPES.Identifier) {
          name = node.id.name;
        } else if (
          'key' in node &&
          node.key &&
          node.key.type === AST_NODE_TYPES.Identifier
        ) {
          name = node.key.name;
        }

        // Update enclosing scope (innermost wins)
        enclosing = {
          name,
          startLine: node.loc.start.line,
          endLine: node.loc.end.line,
        };
      }

      // Recursively walk children
      for (const key in node) {
        const child = (node as any)[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            child.forEach((item) => {
              if (item && typeof item === 'object' && item.type) {
                walk(item);
              }
            });
          } else if (child.type) {
            walk(child);
          }
        }
      }
    }
  }

  walk(ast);
  return enclosing;
}
