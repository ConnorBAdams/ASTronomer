// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ASTGenerator } from "./astGenerator";
import { ASTProvider } from "./astProvider";
import { ASTNode } from "./astProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    vscode.window.showInformationMessage("TreeViewer is running");

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand(
        "treeviewer.reloadTree",
        () => {
            vscode.window.showInformationMessage("Reload started");
            generate();
        }
    ));
    context.subscriptions.push(vscode.commands.registerCommand(
        "treeviewer.copyName",
        (e: ASTNode) => {
            vscode.window.showInformationMessage("Copied to Clipboard");
            copyName(e);
        }
    ));
    context.subscriptions.push(vscode.commands.registerCommand(
        "treeviewer.copySExpression",
        (e: ASTNode) => {
            vscode.window.showInformationMessage("Copied to Clipboard");
            copySExpression(e);
        }
    ));

    generate();
}

function highlightText(node: ASTNode) {
    console.log("Highlighting text");
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const startPos = editor.document.positionAt(node.node.startIndex);
        const endPos = editor.document.positionAt(node.node.endIndex);
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

vscode.window.onDidChangeActiveTextEditor(() => {
    generate();
});

function generate() {
    console.log("Generate called");
    if (!vscode.window.activeTextEditor) {
        // When changing tabs, the activeTextEditor will be undefined
        // to simplify error handling we'll just return. No AST to generate anyway
        return;
    }
    const astGenerator = new ASTGenerator();
    astGenerator
        .getAST()
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
