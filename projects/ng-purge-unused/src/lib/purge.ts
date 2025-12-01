import {
  Project,
  SyntaxKind,
  Node,
  VariableDeclaration,
  FunctionDeclaration,
  MethodDeclaration,
  ClassDeclaration,
} from "ts-morph";
import * as path from "path";
import { isAngularClass, isExcluded } from "./utils";

// Get reference count (Works across ts-morph versions)
function refCount(node: Node): number {
  const n: any = node;

  if (typeof n.findReferencesAsNodes === "function") {
    return n.findReferencesAsNodes().length;
  }

  if (typeof n.findReferences === "function") {
    try {
      return n.findReferences().flatMap((ref: any) => ref.getReferences()).length;
    } catch {
      return 0;
    }
  }

  return 0;
}

// Safe delete strategy for new ts-morph versions
function safeDelete(node: Node) {
  const n: any = node;

  try {
    if (typeof n.remove === "function") return n.remove();
    if (typeof n.removeText === "function") return n.removeText();
    node.replaceWithText("");
  } catch (err) {
    console.log("⚠ Could not delete node safely:", node.getKindName());
  }
}

export async function purgePath(targetPath: string, options: any = {}) {
  console.log("🔍 Scanning:", targetPath);

  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
  });

  project.addSourceFilesAtPaths(`${targetPath}/**/*.ts`);

  for (const file of project.getSourceFiles()) {
    console.log(`📄 File: ${file.getBaseName()}`);

    const removeNodes: Node[] = [];

    file.fixUnusedIdentifiers();

    file.forEachDescendant((node) => {
      // remove console
      if (options.removeLogs) {
        if (
          node.getKind() === SyntaxKind.CallExpression &&
          node.getText().startsWith("console.log")
        ) {
          const p = node.getParentIfKind(SyntaxKind.ExpressionStatement);
          if (p) removeNodes.push(p);
        }
      }

      // unused variable
      if (node.getKind() === SyntaxKind.VariableDeclaration) {
        const v = node.asKindOrThrow(SyntaxKind.VariableDeclaration);
        if (refCount(v) === 0) removeNodes.push(v);
      }

      // unused function
      if (node.getKind() === SyntaxKind.FunctionDeclaration) {
        const f = node.asKindOrThrow(SyntaxKind.FunctionDeclaration);
        if (f.getName() && refCount(f) === 0) removeNodes.push(f);
      }

      // private unused method
      if (node.getKind() === SyntaxKind.MethodDeclaration) {
        const m = node.asKindOrThrow(SyntaxKind.MethodDeclaration);
        if (m.hasModifier(SyntaxKind.PrivateKeyword) && refCount(m) === 0) removeNodes.push(m);
      }

      // unused class
      if (node.getKind() === SyntaxKind.ClassDeclaration) {
        const c = node.asKindOrThrow(SyntaxKind.ClassDeclaration);

        if (c.getName() && !isAngularClass(c.getDecorators()) && refCount(c) === 0) {
          removeNodes.push(c);
        }
      }
    });

    if (!options.dry) {
      removeNodes.forEach(safeDelete);
      await file.save();
    } else {
      console.log(`🔎 Dry run: ${removeNodes.length} items found`);
    }
  }

  console.log("✅ Done.");
}
