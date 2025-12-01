#!/usr/bin/env node

import { fileURLToPath } from "url";
import path from "path";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create require that resolves from this CLI's folder
const require = createRequire(import.meta.url);

// Resolve actual module root inside global npm folder
const moduleRoot = path.dirname(require.resolve("ng-purge-unused/package.json"));

// FINAL built purge file path
const purgeFile = path.join(
  moduleRoot,
  "fesm2022/ng-purge-unused.mjs"
);

// Load purge module
import(purgeFile).then(({ purgePath }) => {
  const args = process.argv.slice(2);

  function getArg(name, def) {
    const i = args.indexOf(name);
    if (i === -1) return def;
    return args[i + 1] ?? true;
  }

  const options = {
    path: getArg("--path"),
    dry: args.includes("--dry"),
    ignoreList: getArg("--ignore", "").split(",").filter(Boolean),
    exclude: getArg("--exclude", "").split(",").filter(Boolean),
    removeLogs: args.includes("--remove-logs")
  };

  if (!options.path) {
    console.log("Usage: ng-purge-unused --path src/app --remove-logs");
    process.exit(1);
  }

  purgePath(options.path, options);
}).catch(err => {
  console.error("❌ Failed to load purge engine:", err);
});
