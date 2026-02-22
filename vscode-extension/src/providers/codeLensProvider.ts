import * as vscode from 'vscode';

/**
 * Regex patterns for matching function definitions in TypeScript/JavaScript.
 * Each pattern captures the function name in group 1.
 */
const FUNCTION_PATTERNS: RegExp[] = [
  // function declarations: function foo(...)
  /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
  // arrow functions assigned to const/let/var: const foo = (...) =>
  /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g,
  // method definitions in classes/objects: foo(...) { or async foo(...)
  /^\s+(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*(?::\s*\S+\s*)?\{/gm,
  // exported function declarations: export function foo(...)
  /\bexport\s+(?:default\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
];

export class ContextPackerCodeLensProvider implements vscode.CodeLensProvider {
  private readonly onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this.onDidChangeCodeLensesEmitter.event;

  public refresh(): void {
    this.onDidChangeCodeLensesEmitter.fire();
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const text = document.getText();
    const seenFunctions = new Set<string>();

    for (const pattern of FUNCTION_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(text)) !== null) {
        const functionName = match[1];

        if (seenFunctions.has(functionName) || isKeyword(functionName)) {
          continue;
        }
        seenFunctions.add(functionName);

        const position = document.positionAt(match.index);
        const range = new vscode.Range(position, position);

        const lens = new vscode.CodeLens(range, {
          title: `$(references) Analyze references`,
          command: 'contextPacker.analyzeFunction',
          arguments: [functionName],
          tooltip: `Context Packer: Analyze "${functionName}" references`,
        });

        lenses.push(lens);
      }
    }

    return lenses;
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    _token: vscode.CancellationToken
  ): vscode.CodeLens {
    return codeLens;
  }
}

function isKeyword(name: string): boolean {
  const keywords = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case',
    'break', 'continue', 'return', 'throw', 'try', 'catch',
    'finally', 'new', 'delete', 'typeof', 'void', 'in',
    'instanceof', 'this', 'class', 'extends', 'super',
    'import', 'export', 'default', 'from', 'as',
    'constructor', 'get', 'set',
  ]);
  return keywords.has(name);
}
