import { Decorator } from "ts-morph";

export function isAngularClass(decorators: Decorator[]) {
  const names = decorators.map(d => d.getName());
  const angularDecorators = [
    "Component",
    "Directive",
    "Injectable",
    "Pipe",
    "NgModule",
    "Input",
    "Output"
  ];
  return names.some(n => angularDecorators.includes(n));
}

export function isExcluded(filePath: string, patterns: string[]) {
  return patterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\./g, "\\.").replace(/\*/g, ".*"));
    return regex.test(filePath);
  });
}
