#!/usr/bin/env node

import { purgePath } from "./dist/ng-purge-unused/fesm2022/ng-purge-unused.mjs";

const args = process.argv.slice(2);

// helper
function getArg(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

const options = {
  path: getArg("--path"),
  dry: args.includes("--dry"),
  removeLogs: args.includes("--remove-logs"),
  ignoreList: getArg("--ignore", "").split(",").filter(Boolean),
  exclude: getArg("--exclude", "").split(",").filter(Boolean),
};

if (!options.path) {
  console.error("Usage: ng-purge-unused --path <folder>");
  process.exit(1);
}

purgePath(options.path, options);
