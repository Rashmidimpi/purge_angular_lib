#!/usr/bin/env node
import { purgePath } from "ng-purge-unused";

const args = process.argv.slice(2);

function getArg(name, d) {
  const i = args.indexOf(name);
  if (i === -1) return d;
  return args[i + 1] ?? true;
}

const options = {
  path: getArg("--path"),
  dry: args.includes("--dry"),
  exclude: getArg("--exclude","").split(",").filter(Boolean),
  removeLogs: args.includes("--remove-logs")
};

if (!options.path) {
  console.error("Usage: ng-purge-unused --path src/app --remove-logs");
  process.exit(1);
}

purgePath(options.path, options);
