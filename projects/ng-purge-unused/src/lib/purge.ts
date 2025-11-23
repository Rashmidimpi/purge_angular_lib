import {
    Project,
    SyntaxKind,
    Node,
    VariableDeclaration,
    FunctionDeclaration,
    MethodDeclaration,
    ClassDeclaration
  } from "ts-morph";
  import * as path from "node:path";
  import { isAngularClass, isExcluded } from "./utils";
  
  function refCount(node: Node): number {
    const n: any = node;
  
    if (typeof n.findReferencesAsNodes === "function") {
      return n.findReferencesAsNodes().length;
    }
  
    if (typeof n.findReferences === "function") {
      return n.findReferences().flatMap((r: any) => r.getReferences()).length;
    }
  
    return 0;
  }
  
  function deleteNode(node: Node) {
    const n: any = node;
  
    try {
      if (typeof n.remove === "function") return n.remove();
      if (typeof n.removeText === "function") return n.removeText();
      node.replaceWithText("");
    } catch (err) {
      console.warn("Failed to delete:", node.getKindName());
    }
  }
  
  export async function purgePath(targetPath: string, options: any = {}) {
    console.log("🔍 Scanning:", targetPath);
  
    const project = new Project({
      tsConfigFilePath: path.join(process.cwd(), "tsconfig.json")
    });
  
    project.addSourceFilesAtPaths(`${targetPath}/**/*.ts`);
  
    for (const file of project.getSourceFiles()) {
      const filePath = file.getFilePath();
  
      if (options.exclude?.length && isExcluded(filePath, options.exclude)) {
        console.log("⏭ Skipping:", file.getBaseName());
        continue;
      }
  
      console.log(`📄 File: ${file.getBaseName()}`);
  
      const removeNodes: Node[] = [];
  
      file.fixUnusedIdentifiers();
  
      file.forEachDescendant((node) => {
        if (options.removeLogs) {
          if (
            node.getKind() === SyntaxKind.CallExpression &&
            node.getText().startsWith("console.log")
          ) {
            const p = node.getParentIfKind(SyntaxKind.ExpressionStatement);
            if (p) removeNodes.push(p);
          }
  
          if (node.getKind() === SyntaxKind.DebuggerStatement) {
            removeNodes.push(node);
          }
        }
  
        if (node.getKind() === SyntaxKind.VariableDeclaration) {
          const v = node.asKindOrThrow(SyntaxKind.VariableDeclaration);
          if (refCount(v) === 0) removeNodes.push(v);
        }
  
        if (node.getKind() === SyntaxKind.FunctionDeclaration) {
          const f = node.asKindOrThrow(SyntaxKind.FunctionDeclaration);
          if (f.getName() && refCount(f) === 0) removeNodes.push(f);
        }
  
        if (node.getKind() === SyntaxKind.MethodDeclaration) {
          const m = node.asKindOrThrow(SyntaxKind.MethodDeclaration);
          if (m.hasModifier(SyntaxKind.PrivateKeyword) && refCount(m) === 0) {
            removeNodes.push(m);
          }
        }
  
        if (node.getKind() === SyntaxKind.ClassDeclaration) {
          const c = node.asKindOrThrow(SyntaxKind.ClassDeclaration);
          if (c.getName() && !isAngularClass(c.getDecorators()) && refCount(c) === 0) {
            removeNodes.push(c);
          }
        }
      });
  
      if (!options.dry) {
        removeNodes.forEach(deleteNode);
        await file.save();
      } else {
        console.log(`🔎 Dry run: ${removeNodes.length} items found`);
      }
    }
  
    console.log("✅ Done.");
  }
  
  console.log("ng-purge-unused loaded");
  