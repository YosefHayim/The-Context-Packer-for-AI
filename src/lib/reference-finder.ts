import { AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { parseFile } from './parser';
import { findPythonReferences, parsePythonFile } from './python-parser';
import type { CodeLocation } from '../types';

/**
 * Find all references to a function in a file using AST
 */
export function findReferencesInFile(
  filePath: string,
  functionName: string
): CodeLocation[] {
  if (filePath.endsWith('.py')) {
    return findPythonReferences(filePath, functionName);
  }

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
 * Find the enclosing Python scope with line range for a given line number.
 * Uses parsePythonFile AST to find the innermost function/class/method.
 */
function findPythonEnclosingScopeWithLines(
  filePath: string,
  line: number
): { name: string; startLine: number; endLine: number } | null {
  const pythonAst = parsePythonFile(filePath);

  let best: { name: string; startLine: number; endLine: number } | null = null;
  let bestSize = Infinity;

  for (const func of pythonAst.functions) {
    if (func.startLine <= line && func.endLine >= line) {
      const size = func.endLine - func.startLine;
      if (size < bestSize) {
        best = { name: func.name, startLine: func.startLine, endLine: func.endLine };
        bestSize = size;
      }
    }
  }

  for (const cls of pythonAst.classes) {
    if (cls.startLine <= line && cls.endLine >= line) {
      const size = cls.endLine - cls.startLine;
      if (size < bestSize) {
        best = { name: cls.name, startLine: cls.startLine, endLine: cls.endLine };
        bestSize = size;
      }
    }
    for (const method of cls.methods) {
      if (method.startLine <= line && method.endLine >= line) {
        const size = method.endLine - method.startLine;
        if (size < bestSize) {
          best = { name: method.name, startLine: method.startLine, endLine: method.endLine };
          bestSize = size;
        }
      }
    }
  }

  return best;
}

/**
 * Find the enclosing function/scope for a given location
 */
export function findEnclosingScope(
  filePath: string,
  location: CodeLocation
): { name: string; startLine: number; endLine: number } | null {
  if (filePath.endsWith('.py')) {
    return findPythonEnclosingScopeWithLines(filePath, location.line);
  }

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
