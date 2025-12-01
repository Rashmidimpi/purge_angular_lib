import {
  Project,
  SyntaxKind,
  Node,
  VariableDeclaration,
  FunctionDeclaration,
  MethodDeclaration,
  ClassDeclaration
} from "ts-morph";
import * as path from "path";

// FORCE ROOT TSCONFIG PATH (fix for Mac + Windows)
const ROOT_TSCONFIG = path.join(process.cwd(), "tsconfig.json");

export async function purgePath(targetPath: string, options: any = {}) {
  console.log("ng-purge-unused loaded");
  console.log("🔍 Scanning:", targetPath);

  const project = new Project({
    tsConfigFilePath: ROOT_TSCONFIG,
    skipAddingFilesFromTsConfig: true
  });

  project.addSourceFilesAtPaths(`${targetPath}/**/*.ts`);

  for (const file of project.getSourceFiles()) {
    const removeNodes: Node[] = [];

    file.fixUnusedIdentifiers();

    file.forEachDescendant((node) => {

      // Remove console.log + debugger
      if (options.removeLogs) {
        if (
          node.getKind() === SyntaxKind.CallExpression &&
          node.getText().startsWith("console.log")
        ) {
          const parent = node.getParentIfKind(SyntaxKind.ExpressionStatement);
          if (parent) removeNodes.push(parent);
        }

        if (node.getKind() === SyntaxKind.DebuggerStatement) {
          removeNodes.push(node);
        }
      }

      // Remove unused variable
      if (node.getKind() === SyntaxKind.VariableDeclaration) {
        const v = node.asKindOrThrow(SyntaxKind.VariableDeclaration);
        if (v.findReferencesAsNodes().length === 0) removeNodes.push(v);
      }

      // Remove unused function
      if (node.getKind() === SyntaxKind.FunctionDeclaration) {
        const fn = node.asKindOrThrow(SyntaxKind.FunctionDeclaration);
        if (fn.getName() && fn.findReferencesAsNodes().length === 0)
          removeNodes.push(fn);
      }

      // Remove unused private method
      if (node.getKind() === SyntaxKind.MethodDeclaration) {
        const m = node.asKindOrThrow(SyntaxKind.MethodDeclaration);
        if (
          m.hasModifier(SyntaxKind.PrivateKeyword) &&
          m.findReferencesAsNodes().length === 0
        ) {
          removeNodes.push(m);
        }
      }

      // Remove unused class
      if (node.getKind() === SyntaxKind.ClassDeclaration) {
        const c = node.asKindOrThrow(SyntaxKind.ClassDeclaration);
        if (c.getName() && c.findReferencesAsNodes().length === 0) {
          removeNodes.push(c);
        }
      }
    });

    if (!options.dry) {
      removeNodes.forEach((node) => {
        try {
          (node as any).remove?.() || node.replaceWithText("");
        } catch {}
      });

      await file.save();
    } else {
      console.log(`🔎 Dry run: ${removeNodes.length} items found`);
    }
  }

  console.log("✅ Done.");
}
