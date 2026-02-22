import * as vscode from 'vscode';
import type { AnalysisResult, FunctionReference } from 'context-packer';

export class ResultsPanel {
  public static readonly viewType = 'contextPacker.results';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (message: { command: string; text?: string }) => {
        if (message.command === 'copy' && message.text) {
          vscode.env.clipboard.writeText(message.text).then(
            () => vscode.window.showInformationMessage('Copied to clipboard!'),
            () => vscode.window.showErrorMessage('Failed to copy to clipboard')
          );
        }
      },
      null,
      this.disposables
    );
  }

  public static show(
    extensionUri: vscode.Uri,
    result: AnalysisResult,
    formattedOutput: string
  ): ResultsPanel {
    const column = vscode.ViewColumn.Beside;

    const panel = vscode.window.createWebviewPanel(
      ResultsPanel.viewType,
      `Context: ${result.functionName}`,
      column,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
        retainContextWhenHidden: true,
      }
    );

    const resultsPanel = new ResultsPanel(panel, extensionUri);
    resultsPanel.update(result, formattedOutput);
    return resultsPanel;
  }

  public update(result: AnalysisResult, formattedOutput: string): void {
    this.panel.title = `Context: ${result.functionName}`;
    this.panel.webview.html = this.getHtml(result, formattedOutput);
  }

  private getHtml(result: AnalysisResult, formattedOutput: string): string {
    const nonce = getNonce();

    const referencesHtml = result.references
      .map((ref: FunctionReference) => this.renderReference(ref))
      .join('\n');

    const escapedOutput = escapeHtml(formattedOutput);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <title>Context Packer Results</title>
  <style nonce="${nonce}">
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 16px;
      line-height: 1.5;
    }
    h1 {
      font-size: 1.4em;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .summary {
      background: var(--vscode-textBlockQuote-background);
      border-left: 3px solid var(--vscode-textLink-foreground);
      padding: 8px 12px;
      margin-bottom: 16px;
      border-radius: 2px;
    }
    .reference {
      margin-bottom: 12px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .reference-header {
      background: var(--vscode-editor-lineHighlightBackground);
      padding: 6px 12px;
      font-size: 0.9em;
      cursor: pointer;
    }
    .reference-header:hover {
      background: var(--vscode-list-hoverBackground);
    }
    pre {
      margin: 0;
      padding: 12px;
      overflow-x: auto;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      background: var(--vscode-editor-background);
    }
    .actions {
      margin: 16px 0;
      display: flex;
      gap: 8px;
    }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 6px 14px;
      cursor: pointer;
      border-radius: 2px;
      font-size: 0.9em;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .raw-output {
      margin-top: 24px;
    }
    .raw-output pre {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <h1>Analysis: <code>${escapeHtml(result.functionName)}</code></h1>

  <div class="summary">
    Found <strong>${result.count}</strong> reference${result.count !== 1 ? 's' : ''}
    across the workspace.
  </div>

  <div class="actions">
    <button id="copyBtn">Copy to Clipboard</button>
  </div>

  <div class="references">
    ${referencesHtml}
  </div>

  <div class="raw-output">
    <h2>Formatted Output</h2>
    <pre><code>${escapedOutput}</code></pre>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    document.getElementById('copyBtn').addEventListener('click', function() {
      vscode.postMessage({
        command: 'copy',
        text: ${JSON.stringify(formattedOutput)}
      });
    });

    document.querySelectorAll('.reference-header').forEach(function(header) {
      header.addEventListener('click', function() {
        var file = this.getAttribute('data-file');
        var line = parseInt(this.getAttribute('data-line') || '1', 10);
        vscode.postMessage({
          command: 'openFile',
          file: file,
          line: line
        });
      });
    });
  </script>
</body>
</html>`;
  }

  private renderReference(ref: FunctionReference): string {
    const relativePath = ref.location.filePath;
    const scope = ref.enclosingScope ? ` (in ${escapeHtml(ref.enclosingScope)})` : '';

    return `<div class="reference">
  <div class="reference-header"
       data-file="${escapeHtml(ref.location.filePath)}"
       data-line="${ref.location.line}">
    📄 ${escapeHtml(relativePath)}:${ref.location.line}${scope}
  </div>
  <pre><code>${escapeHtml(ref.context)}</code></pre>
</div>`;
  }

  private dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
