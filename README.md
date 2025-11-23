🌪️ ng-purge-unused

Automatic cleanup tool for Angular & TypeScript projects.
Removes unused variables, functions, classes, private methods, console.log() statements, and debugger from your Angular/TS codebase.

🚀 Features
✅ Automatic Cleanup

Unused variables

Unused functions

Unused private methods

Unused classes

Unused imports (via fixUnusedIdentifiers())

🧹 Code Hygiene

Removes all console.log()

Removes all debugger statements

🎯 Smart Detection

Skips Angular-decorated classes like:

@Component

@Injectable

@Directive

@Pipe

@NgModule

Does not touch Angular files unless truly unused

🛡️ Safe Mode

--dry mode to preview changes before applying

📁 Path-based Cleanup

Clean any folder:

ng-purge-unused --path src/app

📝 Ignore / Exclude Support

--ignore name1,name2

--exclude src/**/*.spec.ts

📦 Installation

Install globally:

npm install -g ng-purge-unused


Or use with npx:

npx ng-purge-unused --path src/app

🏃 Usage

Run in your Angular or TypeScript project:

ng-purge-unused --path <folder>

Example:
ng-purge-unused --path src/app