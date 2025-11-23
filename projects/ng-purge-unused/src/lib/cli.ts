#!/usr/bin/env node

import { purgePath } from "./purge";

const args = process.argv.slice(2);

function getArg(name: string, def?: any) {
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
  console.error("Usage: ng-purge-unused --path src/app");
  process.exit(1);
}

purgePath(options.path, options);
