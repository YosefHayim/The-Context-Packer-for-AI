import * as vscode from 'vscode';
import { createContextPacker, formatForLLM, ContextDepth } from 'context-packer';
import type { AnalysisResult } from 'context-packer';
import { ResultsPanel } from '../views/resultsPanel';

function getDepthFromConfig(): ContextDepth {
  const config = vscode.workspace.getConfiguration('contextPacker');
  const depthSetting = config.get<string>('defaultDepth', 'logic');

  switch (depthSetting) {
    case 'snippet':
      return ContextDepth.SNIPPET;
    case 'module':
      return ContextDepth.MODULE;
    case 'logic':
    default:
      return ContextDepth.LOGIC;
  }
}

function getExcludePatterns(): string[] {
  const config = vscode.workspace.getConfiguration('contextPacker');
  return config.get<string[]>('exclude', ['**/node_modules/**', '**/dist/**']);
}

function resolveFunctionName(
  editor: vscode.TextEditor,
  codeLensArg?: string
): string | undefined {
  if (codeLensArg) {
    return codeLensArg;
  }

  const position = editor.selection.active;
  const wordRange = editor.document.getWordRangeAtPosition(position, /[a-zA-Z_$][a-zA-Z0-9_$]*/);

  if (!wordRange) {
    return undefined;
  }

  return editor.document.getText(wordRange);
}

async function runAnalysis(
  workspaceRoot: string,
  functionName: string
): Promise<{ result: AnalysisResult; formatted: string }> {
  const depth = getDepthFromConfig();
  const exclude = getExcludePatterns();

  const packer = createContextPacker(workspaceRoot, depth, {
    exclude,
  });

  const result = packer.analyze(functionName);
  const formatted = formatForLLM(result, workspaceRoot);

  return { result, formatted };
}

export async function analyzeFunction(
  extensionUri: vscode.Uri,
  codeLensArg?: string
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Context Packer: No active editor');
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (!workspaceFolder) {
    vscode.window.showWarningMessage('Context Packer: No workspace folder found');
    return;
  }

  const functionName = resolveFunctionName(editor, codeLensArg);
  if (!functionName) {
    vscode.window.showWarningMessage('Context Packer: Place cursor on a function name');
    return;
  }

  const workspaceRoot = workspaceFolder.uri.fsPath;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Analyzing "${functionName}"...`,
      cancellable: false,
    },
    async () => {
      try {
        const { result, formatted } = await runAnalysis(workspaceRoot, functionName);

        if (result.count === 0) {
          vscode.window.showInformationMessage(
            `Context Packer: No references found for "${functionName}"`
          );
          return;
        }

        ResultsPanel.show(extensionUri, result, formatted);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Context Packer analysis failed: ${message}`);
      }
    }
  );
}

export async function analyzeAndCopy(codeLensArg?: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Context Packer: No active editor');
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (!workspaceFolder) {
    vscode.window.showWarningMessage('Context Packer: No workspace folder found');
    return;
  }

  const functionName = resolveFunctionName(editor, codeLensArg);
  if (!functionName) {
    vscode.window.showWarningMessage('Context Packer: Place cursor on a function name');
    return;
  }

  const workspaceRoot = workspaceFolder.uri.fsPath;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Analyzing "${functionName}"...`,
      cancellable: false,
    },
    async () => {
      try {
        const { result, formatted } = await runAnalysis(workspaceRoot, functionName);

        if (result.count === 0) {
          vscode.window.showInformationMessage(
            `Context Packer: No references found for "${functionName}"`
          );
          return;
        }

        await vscode.env.clipboard.writeText(formatted);
        vscode.window.showInformationMessage(
          `Context Packer: ${result.count} reference${result.count !== 1 ? 's' : ''} copied to clipboard`
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Context Packer analysis failed: ${message}`);
      }
    }
  );
}
