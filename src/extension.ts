// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ASTGenerator } from "./astGenerator";
import { ASTProvider } from "./astProvider";
import { ASTNode } from "./astProvider";
import { SyntaxNode } from "web-tree-sitter";
import { QueryTest } from "./testWebView";

const astGenerator = new ASTGenerator();
let lineNumbersEnabled: boolean = false;

export function activate(context: vscode.ExtensionContext) {
    console.log("ASTronomer is now active!");

    context.subscriptions.push(
        vscode.commands.registerCommand("astronomer.reloadTree", () => {
            vscode.window.showInformationMessage("Reload started");
            generate();
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("astronomer.copyName", (e: ASTNode) => {
            vscode.window.showInformationMessage("Copied to Clipboard");
            copyName(e);
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "astronomer.copySExpression",
            (e: ASTNode) => {
                vscode.window.showInformationMessage("Copied to Clipboard");
                copySExpression(e);
            }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("astronomer.runQuery", () => runQuery())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("astronomer.toggleLineNumbers", () => toggleLineNumbers())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("astronomer.registerCustomWASM", () => registerCustomWASM())
    );
    vscode.window.onDidChangeActiveTextEditor(() => {
        generate(false);
    });

    const provider = new QueryTest(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(QueryTest.viewType, provider));

    generate();
}

function highlightText(node: ASTNode | SyntaxNode) {
    if (node instanceof ASTNode) {
        node = node.node;
    }
    console.log("Highlighting text" + node.startIndex + " " + node.endIndex);
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const startPos = editor.document.positionAt(node.startIndex);
        const endPos = editor.document.positionAt(node.endIndex);
        const range = new vscode.Range(startPos, endPos);
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range);
    }
}

function toggleLineNumbers() {
    lineNumbersEnabled = !lineNumbersEnabled;
    generate(true);
}

function copyName(node: ASTNode) {
    vscode.env.clipboard.writeText(node.node.type);
}

function copySExpression(node: ASTNode) {
    vscode.env.clipboard.writeText(node.node.toString());
}

async function runQuery() {
    let expression = await vscode.window.showInputBox({
        prompt: "Enter query expression - do not include an @ identifier",
        placeHolder: "Enter query expression",
    });
    console.log("Querying: " + expression);
    if (expression !== undefined) {
        expression += " @query";
        astGenerator.queryAST(expression).then((results) => {
            iterateOverResults(results);
        });
    }
}

async function registerCustomWASM() {
    let fileType = await vscode.window.showInputBox({
        prompt: "Enter the name of the file type you wish to regiter",
        placeHolder: "Example: python, c_sharp, javascript, etc",
    });
    if (fileType !== undefined) {
        const selectedFile = await vscode.window.showOpenDialog();
        if (selectedFile !== undefined) {
            astGenerator.setCustomWASM(fileType, selectedFile[0].fsPath);
        }
    }
}

async function iterateOverResults(results: SyntaxNode[]) {
    let currentIndex = 0;
    while (currentIndex < results.length) {
        console.log(results[currentIndex].toString());
        highlightText(results[currentIndex]);
        if (currentIndex < results.length - 1) {
            let answer = await vscode.window.showInformationMessage(
                "View next result?",
                "Yes",
                "No"
            );
            if (answer === "Yes") {
                currentIndex += 1;
            } else {
                break;
            }
        } else {
            break;
        }
    }
}

// Generate the AST for the tree-view
async function generate(forceRebuild?: boolean) {
    console.log("Generate called");
    if (!vscode.window.activeTextEditor) {
        // When changing tabs, the activeTextEditor will be undefined
        // to simplify error handling we'll just return. No AST to generate anyway
        return;
    }
    const tree = await astGenerator.getAST(forceRebuild);
    const treeView = vscode.window.createTreeView("tree-view", {
        treeDataProvider: new ASTProvider(tree, lineNumbersEnabled),
    });
    treeView.onDidChangeSelection(
        (e: vscode.TreeViewSelectionChangeEvent<ASTNode>) =>
            highlightText(e.selection[0])
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}
