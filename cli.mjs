#!/usr/bin/env node

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve real dist output file path dynamically
const purgePathFile = path.resolve(
  __dirname,
  "./dist/ng-purge-unused/fesm2022/ng-purge-unused.mjs"
);

import(purgePathFile).then(({ purgePath }) => {
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
    removeLogs: args.includes("--remove-logs"),
  };

  if (!options.path) {
    console.log("Usage: ng-purge-unused --path src/app --remove-logs");
    process.exit(1);
  }

  purgePath(options.path, options);
}).catch((err) => {
  console.error("❌ Could not load purge engine:", err);
});
