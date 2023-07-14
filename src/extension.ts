// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ASTGenerator } from "./astGenerator";
import { ASTProvider } from "./astProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    vscode.window.showInformationMessage("TreeViewer is running");

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(
        "treeviewer.reloadTree",
        () => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            vscode.window.showInformationMessage("Reload started");
            generate();
        }
    );
    context.subscriptions.push(disposable);
    generate();
}

vscode.window.onDidChangeActiveTextEditor(() => {
    generate();
});

function generate() {
    console.log('Generate called');
    if (!vscode.window.activeTextEditor) {
        // When changing tabs, the activeTextEditor will be undefined
        // to simplify error handling we'll just return. No AST to generate anyway
        return;
    }
    const astGenerator = new ASTGenerator();
    astGenerator.getAST().then((tree) => {
        if (tree) {
            vscode.window.registerTreeDataProvider(
                "tree-view",
                new ASTProvider(tree)
            );
        }
    }).catch((err) => {
        console.log(err);
    });
}

// This method is called when your extension is deactivated
export function deactivate() {}
