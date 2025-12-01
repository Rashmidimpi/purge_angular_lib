#!/usr/bin/env node

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Dynamically detect real mjs output path ----
const candidatePaths = [
  "../dist/ng-purge-unused/fesm2022/ng-purge-unused.mjs",
  "./dist/ng-purge-unused/fesm2022/ng-purge-unused.mjs",
  "dist/ng-purge-unused/fesm2022/ng-purge-unused.mjs"
];

let purgeEnginePath = null;

for (const p of candidatePaths) {
  const resolved = path.resolve(__dirname, p);
  if (fs.existsSync(resolved)) {
    purgeEnginePath = resolved;
    break;
  }
}

if (!purgeEnginePath) {
  console.error("❌ Could not locate purge engine output. Rebuild or reinstall package.");
  process.exit(1);
}

import(purgeEnginePath).then(({ purgePath }) => {
  const args = process.argv.slice(2);

  function getArg(name, def) {
    const idx = args.indexOf(name);
    if (idx === -1) return def;
    return args[idx + 1] ?? true;
  }

  const options = {
    path: getArg("--path"),
    dry: args.includes("--dry"),
    removeLogs: args.includes("--remove-logs"),
    exclude: getArg("--exclude", "").split(",").filter(Boolean),
    ignoreList: getArg("--ignore", "").split(",").filter(Boolean)
  };

  if (!options.path) {
    console.log("Usage: ng-purge-unused --path src/app --remove-logs");
    process.exit(1);
  }

  purgePath(options.path, options);
}).catch((err) => {
  console.error("❌ Engine load failed:", err);
});
