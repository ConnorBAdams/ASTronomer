import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Tree } from "web-tree-sitter";

export class ASTProvider
    implements vscode.TreeDataProvider<ASTNode>
{
    constructor(private ast: Tree) {}

    getTreeItem(element: ASTNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ASTNode): Thenable<ASTNode[]> {
        return Promise.resolve([]);
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }
}

class ASTNode extends vscode.TreeItem {
    constructor(
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
