import {
  Project,
  SyntaxKind,
  Node
} from "ts-morph";
import path from "path";
import { isAngularClass, isExcluded } from "./utils";

function refCount(node: Node): number {
  const n: any = node;

  try {
    if (typeof n.findReferencesAsNodes === "function") {
      return n.findReferencesAsNodes().length;
    }

    if (typeof n.findReferences === "function") {
      return n.findReferences()
        .flatMap((r: any) => r.getReferences()).length;
    }
  } catch (err) {}

  return 0; // fallback
}

function safeDelete(node: Node) {
  const n: any = node;
  try {
    if (typeof n.remove === "function") {
      n.remove();
      return;
    }

    if (typeof n.removeText === "function") {
      n.removeText();
      return;
    }

    node.replaceWithText("");
  } catch (e) {
    console.warn("⚠ Failed to delete node:", node.getKindName());
  }
}

export async function purgePath(targetPath: string, options: any = {}) {
  console.log("🔍 Scanning:", targetPath);

  const tsconfig = options.tsconfig
    ? path.join(process.cwd(), options.tsconfig)
    : path.join(process.cwd(), "tsconfig.json");

  const project = new Project({
    tsConfigFilePath: tsconfig
  });

  project.addSourceFilesAtPaths(`${targetPath}/**/*.ts`);

  for (const file of project.getSourceFiles()) {
    const filePath = file.getFilePath();

    if (options.exclude?.length && isExcluded(filePath, options.exclude)) {
      console.log("⏭ Skipping:", file.getBaseName());
      continue;
    }

    const removeNodes: Node[] = [];

    file.fixUnusedIdentifiers();

    file.forEachDescendant(node => {

      if (options.removeLogs) {
        if (node.getKind() === SyntaxKind.CallExpression &&
          node.getText().startsWith("console.log")) {
          const expr = node.getParentIfKind(SyntaxKind.ExpressionStatement);
          if (expr) removeNodes.push(expr);
        }
        if (node.getKind() === SyntaxKind.DebuggerStatement) {
          removeNodes.push(node);
        }
      }

      if (node.getKind() === SyntaxKind.VariableDeclaration) {
        if (refCount(node) === 0) removeNodes.push(node);
      }

      if (node.getKind() === SyntaxKind.FunctionDeclaration) {
        const n: any = node;
        if (n.getName() && refCount(node) === 0) removeNodes.push(node);
      }

      if (node.getKind() === SyntaxKind.MethodDeclaration) {
        const n: any = node;
        if (n.hasModifier && n.hasModifier(SyntaxKind.PrivateKeyword) &&
          refCount(node) === 0) {
          removeNodes.push(node);
        }
      }

      if (node.getKind() === SyntaxKind.ClassDeclaration) {
        const n: any = node;
        if (n.getName() &&
          !isAngularClass(n.getDecorators()) &&
          refCount(node) === 0) {
          removeNodes.push(node);
        }
      }
    });

    if (options.dry) {
      console.log(`🔎 Dry run: ${removeNodes.length} items found`);
      continue;
    }

    removeNodes.forEach(safeDelete);
    await file.save();
  }

  console.log("✅ Done.");
}
