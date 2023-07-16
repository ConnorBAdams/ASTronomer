const Parser = require("web-tree-sitter");
import { Tree, Language, SyntaxNode } from "web-tree-sitter";
import { resolve as resolvePath } from "path";
import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { ASTNode } from "./astProvider";


interface QueryResult {
    node: SyntaxNode;
    name: string;
}

export class ASTGenerator {
    private parser: any;
    private fileASTs: Map<string, Tree> = new Map<string, Tree>();

    private langLookup: Map<string, string> = new Map<string, string>([
        ["bash","tree-sitter-bash.wasm"],
        ["c_sharp","tree-sitter-c_sharp.wasm"],
        ["c","tree-sitter-c.wasm"],
        ["cpp","tree-sitter-cpp.wasm"],
        ["go","tree-sitter-go.wasm"],
        ["html","tree-sitter-html.wasm"],
        ["java","tree-sitter-java.wasm"],
        ["javascript","tree-sitter-javascript.wasm"],
        ["php","tree-sitter-php.wasm"],
        ["python","tree-sitter-python.wasm"],
        ["ql","tree-sitter-ql.wasm"],
        ["ruby","tree-sitter-ruby.wasm"],
        ["rust","tree-sitter-rust.wasm"],
        ["toml","tree-sitter-toml.wasm"],
        ["typescript","tree-sitter-typescript.wasm"],
        ["yaml","tree-sitter-yaml.wasm"],
    ]);

    public userSuppliedWASMs = new Map<string, string>();

    // TODO: Figure out how to reuse a parser if the language is the same
    private async createParser(langName: string): Promise<typeof Parser> {
        return new Promise(async (resolve, reject) => {
            console.log("Creating parser for language: " + langName);
            await Parser.init();
            this.parser = new Parser();
            // Get the path from the language lookup
            let langPath = this.langLookup.get(langName);
            // Check if the user has supplied a custom wasm
            if (this.userSuppliedWASMs.has(langName)) {
                langPath = this.userSuppliedWASMs.get(langName);
            }
            if (langPath === undefined) {
                reject("Could not find the language");
            } else {
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
            }
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
                console.log("Building AST");
                // If no parser then create one
                this.parser = await this.createParser(
                    currentDoc.languageId
                );
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
                let queryObj: QueryResult[] = await queryResult.captures(tree.rootNode);
                if (queryObj) {
                    let nodes = queryObj.map((node) => node.node);
                    resolve(nodes);
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

    public setCustomWASM(langName: string, path: string) {
        // Remove the language from the lookup in favor of the user's
        if (this.langLookup.has(langName)) {
            this.langLookup.delete(langName);
        }
        console.log("Setting custom WASM for language: " + langName);
        this.userSuppliedWASMs.set(langName, path);
    }
}
