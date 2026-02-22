import * as vscode from 'vscode';
import { analyzeFunction, analyzeAndCopy } from './commands/analyze';
import { ContextPackerCodeLensProvider } from './providers/codeLensProvider';

const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'typescriptreact',
  'javascriptreact',
];

export function activate(context: vscode.ExtensionContext): void {
  const codeLensProvider = new ContextPackerCodeLensProvider();

  const codeLensDisposable = vscode.languages.registerCodeLensProvider(
    SUPPORTED_LANGUAGES.map((language) => ({ language, scheme: 'file' })),
    codeLensProvider
  );

  const analyzeDisposable = vscode.commands.registerCommand(
    'contextPacker.analyzeFunction',
    (codeLensArg?: string) => analyzeFunction(context.extensionUri, codeLensArg)
  );

  const copyDisposable = vscode.commands.registerCommand(
    'contextPacker.analyzeAndCopy',
    (codeLensArg?: string) => analyzeAndCopy(codeLensArg)
  );

  const onChangeDisposable = vscode.workspace.onDidChangeTextDocument(() => {
    codeLensProvider.refresh();
  });

  context.subscriptions.push(
    codeLensDisposable,
    analyzeDisposable,
    copyDisposable,
    onChangeDisposable
  );
}

export function deactivate(): void { /* no-op */ }
