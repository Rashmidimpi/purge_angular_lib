import {
  Project,
  SyntaxKind,
  Node,
  MethodDeclaration,
  PropertyDeclaration,
  ClassDeclaration
} from "ts-morph";
import * as path from "path";

export async function purgePath(targetPath: string, options: any = {}) {
  console.log("🔍 Scanning:", targetPath);

  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), "tsconfig.json")
  });

  project.addSourceFilesAtPaths(`${targetPath}/**/*.ts`);

  for (const file of project.getSourceFiles()) {
    console.log(`📄 File: ${file.getBaseName()}`);

    const removeNodes: Node[] = [];

    // Remove console logs
    if (options.removeLogs) {
      file.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.CallExpression &&
            node.getText().startsWith("console.log")) {
          const stmt = node.getParentIfKind(SyntaxKind.ExpressionStatement);
          if (stmt) removeNodes.push(stmt);
        }
      });
    }

    // Remove unused methods & properties inside class
    file.getClasses().forEach((cls: ClassDeclaration) => {
      cls.getProperties().forEach((prop: PropertyDeclaration) => {
        const name = prop.getName();
        const matches = file.getDescendants().filter(n => n.getText() === name);
        if (matches.length <= 1) {
          console.log("🗑 Unused property:", name);
          removeNodes.push(prop);
        }
      });

      cls.getMethods().forEach((method: MethodDeclaration) => {
        const name = method.getName();
        const matches = file.getDescendants().filter(n => n.getText() === name);
        if (matches.length <= 1) {
          console.log("🗑 Unused method:", name);
          removeNodes.push(method);
        }
      });
    });

    if (!options.dry) {
      removeNodes.forEach(n => n.replaceWithText(""));
      await file.save();
    } else {
      console.log(`🔎 Dry run: ${removeNodes.length} items found`);
    }
  }

  console.log("✅ Done.");
}
