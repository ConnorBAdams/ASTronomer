import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Tree, SyntaxNode } from "web-tree-sitter";

// Docs: https://code.visualstudio.com/api/extension-guides/tree-view
export class ASTProvider implements vscode.TreeDataProvider<ASTNode> {
    private ast: Tree;
    constructor(ast: Tree) {
        this.ast = ast;
    }

    getTreeItem(element: ASTNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ASTNode): Thenable<ASTNode[]> {
        if (!this.ast) {
            vscode.window.showInformationMessage("No AST available.");
            return Promise.resolve([]);
        } else if (element) {
            return Promise.resolve(
                [this.nodeToTreeItem(this.ast.rootNode)]
            );
        } else {
            return Promise.resolve([this.nodeToTreeItem(this.ast.rootNode)]);
        }
    }

    private nodeToTreeItem(node: SyntaxNode): ASTNode {
        return new ASTNode(node, node.id.toString(), vscode.TreeItemCollapsibleState.Collapsed);
    }
}

class ASTNode extends vscode.TreeItem {
    constructor(
        public readonly node: SyntaxNode,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
    }

    iconPath = {
        light: path.join(
            __filename,
            "..",
            "..",
            "resources",
            "light",
            "dependency.svg"
        ),
        dark: path.join(
            __filename,
            "..",
            "..",
            "resources",
            "dark",
            "dependency.svg"
        ),
    };
}
