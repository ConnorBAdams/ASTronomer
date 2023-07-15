const Parser = require("web-tree-sitter");
import { Tree, Language, SyntaxNode } from "web-tree-sitter";
import { resolve as resolvePath } from "path";
import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { ASTNode } from "./astProvider";

export class ASTGenerator {
    private parser: any;
    private fileASTs: Map<string, Tree> = new Map<string, Tree>();

    private langLookup = [
        { name: "bash", path: "tree-sitter-bash.wasm" },
        { name: "c_sharp", path: "tree-sitter-c_sharp.wasm" },
        { name: "c", path: "tree-sitter-c.wasm" },
        { name: "cpp", path: "tree-sitter-cpp.wasm" },
        { name: "go", path: "tree-sitter-go.wasm" },
        { name: "html", path: "tree-sitter-html.wasm" },
        { name: "java", path: "tree-sitter-java.wasm" },
        { name: "javascript", path: "tree-sitter-javascript.wasm" },
        { name: "php", path: "tree-sitter-php.wasm" },
        { name: "python", path: "tree-sitter-python.wasm" },
        { name: "ql", path: "tree-sitter-ql.wasm" },
        { name: "ruby", path: "tree-sitter-ruby.wasm" },
        { name: "rust", path: "tree-sitter-rust.wasm" },
        { name: "toml", path: "tree-sitter-toml.wasm" },
        { name: "typescript", path: "tree-sitter-typescript.wasm" },
        { name: "yaml", path: "tree-sitter-yaml.wasm" },
    ];

    private async createParser(langName: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            console.log("Creating parser for language: " + langName);
            await Parser.init();
            this.parser = new Parser();
            // Get the path from the language lookup
            const langPath = this.langLookup.find(
                (lang) => lang.name === langName
            )?.path;
            if (!langPath) {
                reject("Could not find the language");
            }
            // The path needs to be relative to the build root
            const path = resolvePath(
                __dirname,
                "..",
                "dist/tree-sitter/",
                `${langPath}`
            );
            const language = await Language.load(path);
            this.parser.setLanguage(language);
            console.log("Finished creating Parser");
            resolve(this.parser);
        });
    }

    private async getCurrentFile(): Promise<TextDocument> {
        return new Promise(async (resolve, reject) => {
            const currentDoc = await vscode.window.activeTextEditor?.document;
            if (currentDoc === undefined) {
                reject("No source code found");
            } else {
                resolve(currentDoc);
            }
        });
    }

    public async getAST(forceRebuild?: boolean): Promise<Tree> {
        return new Promise(async (resolve, reject) => {
            // If no current AST then create one
            let currentDoc = await this.getCurrentFile();
            let tree = this.fileASTs.get(
                currentDoc.fileName.toString().toLocaleLowerCase()
            );
            if (tree === undefined || forceRebuild) {
                // If no parser then create one
                if (!this.parser) {
                    this.parser = await this.createParser(
                        currentDoc.languageId
                    );
                }
                // Generate the AST
                tree = await this.parser.parse(currentDoc.getText());
                if (tree) {
                    this.fileASTs.set(currentDoc.fileName.toString(), tree);
                    resolve(tree);
                } else {
                    reject("Could not parse the AST");
                }
            } else {
                resolve(tree);
            }
        });
    }

    public async queryAST(query: string): Promise<SyntaxNode[]> {
        return new Promise(async (resolve, reject) => {
            const tree = await this.getAST();
            try {
                let queryResult = await this.parser.language.query(query);
                let queryObj = await queryResult.captures(tree.rootNode);
                if (queryObj) {
                    resolve(queryObj);
                } else {
                    reject("Could not parse the query");
                }
            } catch (e: any) {
                console.log(e);
                vscode.window.showErrorMessage(e.message);
                reject("Could not parse the query");
            }
        });
    }
}
