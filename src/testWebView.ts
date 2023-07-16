import * as vscode from "vscode";

export class QueryTest implements vscode.WebviewViewProvider {

	public static readonly viewType = 'tree-view-web';
    private _view?: vscode.WebviewView;

    constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
        this._view = webviewView;

        webviewView.webview.html = this.getWebviewContent(webviewView.webview);
    }

    private getWebviewContent(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
    console.log(styleMainUri);
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">

        <!--
            Use a content security policy to only allow loading styles from our extension directory,
            and only allow scripts that have a specific nonce.
            (See the 'webview-sample' extension sample for img-src content security policy examples)
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri.path}" rel="stylesheet">
        <link href="${styleVSCodeUri.path}" rel="stylesheet">
        <link href="${styleMainUri.path}" rel="stylesheet">
    </head>
    <body>
        <textarea type="text" id="query" name="query" rel="stylesheet"></textarea>
        <button id="runQuery" rel="stylesheet">Run Query</button>
        <h1>Test</h1>
    </body>
    </html>`;
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789()@#$%^&*';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
