import * as vscode from "vscode";
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
			if (element.terminal) {
				return Promise.resolve([]);
			}
			let children = element.node.children;
			if (children.length === 0) {
				return Promise.resolve([new ASTNode(element.node, true, vscode.TreeItemCollapsibleState.None)]);
			}
			return Promise.resolve(
				element.node.children.map((node) => this.nodeToTreeItem(node))
			);
		} else {
			return Promise.resolve([this.nodeToTreeItem(this.ast.rootNode)]);
		}
	}

	private nodeToTreeItem(node: SyntaxNode): ASTNode {
		return new ASTNode(node);
	}
}

export class ASTNode extends vscode.TreeItem {
	constructor(
		public readonly node: SyntaxNode,
		public readonly terminal: boolean = false,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
		.TreeItemCollapsibleState.Collapsed,
		public readonly label: string = node.type,
	) {
		super(label, collapsibleState);
		if (this.terminal) {
			this.label = `"${this.node.text}"`;
		}
		// Check if multiline
		else if (this.node.startPosition.row !== this.node.endPosition.row) {
			this.label = `${this.label}: lines ${this.node.startPosition.row} - ${this.node.endPosition.row}`;
		} else {
			this.label = `${this.label}: chars ${this.node.startPosition.column} - ${this.node.endPosition.column}`;
		}

		this.tooltip = `${this.node.text}`;
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
