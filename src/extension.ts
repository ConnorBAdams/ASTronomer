// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ASTGenerator } from "./astGenerator";
import { ASTProvider } from "./astProvider";
import { ASTNode } from "./astProvider";
import { SyntaxNode } from "web-tree-sitter";

const astGenerator = new ASTGenerator();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log("TreeViewer is now active!");

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(
        vscode.commands.registerCommand("treeviewer.reloadTree", () => {
            vscode.window.showInformationMessage("Reload started");
            generate();
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("treeviewer.copyName", (e: ASTNode) => {
            vscode.window.showInformationMessage("Copied to Clipboard");
            copyName(e);
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "treeviewer.copySExpression",
            (e: ASTNode) => {
                vscode.window.showInformationMessage("Copied to Clipboard");
                copySExpression(e);
            }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("treeviewer.runQuery", () => runQuery())
    );

    generate();
}

function highlightText(node: ASTNode | SyntaxNode) {
    if (node instanceof ASTNode) {
        node = node.node;
    }
    console.log("Highlighting text");
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const startPos = editor.document.positionAt(node.startIndex);
        const endPos = editor.document.positionAt(node.endIndex);
        const range = new vscode.Range(startPos, endPos);
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range);
    }
}

function copyName(node: ASTNode) {
    vscode.env.clipboard.writeText(node.node.type);
}

function copySExpression(node: ASTNode) {
    vscode.env.clipboard.writeText(node.node.toString());
}

async function runQuery() {
    let expression = await vscode.window.showInputBox({
        prompt: "Enter query expression",
        placeHolder: "Enter query expression",
    });
    console.log("Querying: " + expression);
    if (expression !== undefined) {
        astGenerator.queryAST(expression).then((result) => {
            console.log(result);
            if (result.length > 0) {
                highlightText(result[0]);
            }
        });
    }
}

vscode.window.onDidChangeActiveTextEditor(() => {
    generate();
});

// Generate the AST for the tree-view
function generate(forceRebuild?: boolean) {
    console.log("Generate called");
    if (!vscode.window.activeTextEditor) {
        // When changing tabs, the activeTextEditor will be undefined
        // to simplify error handling we'll just return. No AST to generate anyway
        return;
    }
    astGenerator
        .getAST(forceRebuild)
        .then((tree) => {
            if (tree) {
                const treeView = vscode.window.createTreeView("tree-view", {
                    treeDataProvider: new ASTProvider(tree),
                });
                treeView.onDidChangeSelection(
                    (e: vscode.TreeViewSelectionChangeEvent<ASTNode>) =>
                        highlightText(e.selection[0])
                );
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

// This method is called when your extension is deactivated
export function deactivate() {}
