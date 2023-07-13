const Parser = require('web-tree-sitter');
import { Tree } from "web-tree-sitter";
import * as vscode from "vscode";

export class ASTGenerator {
    private ast: Tree | undefined;

    constructor() {
        console.log(vscode.window.activeTextEditor?.document.uri.fsPath);
        Parser.init().then(() => {
            const parser = new Parser;
            // The path needs to be relative to the build root
            const JavaScript = Parser.Language.load('tree-sitter-javascript.wasm');
            parser.setLanguage(JavaScript);
        
            const sourceCode = 'let x = 1; console.log(x);';
            this.ast = parser.parse(sourceCode);
        });
    }

    public getAST(): Tree | undefined {
        return this.ast;
    }

}

