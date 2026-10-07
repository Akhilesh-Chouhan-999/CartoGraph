import { Project, ScriptKind, SyntaxKind } from 'ts-morph';

import type { DependencyCandidate, DependencyKind } from './analysis.types.js';

class AstParser {
  private readonly project = new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
  });

  public parse(sourcePath: string, content: string): DependencyCandidate[] {
    const source = this.project.createSourceFile(sourcePath, content, {
      overwrite: true,
      scriptKind: this.getScriptKind(sourcePath),
    });
    const dependencies: DependencyCandidate[] = [];
    for (const declaration of source.getImportDeclarations()) {
      dependencies.push(
        this.candidate(
          sourcePath,
          declaration.getModuleSpecifierValue(),
          'import',
          declaration.getStartLineNumber(),
        ),
      );
    }
    for (const declaration of source.getExportDeclarations()) {
      const specifier = declaration.getModuleSpecifierValue();
      if (specifier !== undefined)
        dependencies.push(
          this.candidate(sourcePath, specifier, 'export', declaration.getStartLineNumber()),
        );
    }
    for (const call of source.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const expression = call.getExpression();
      const argument = call.getArguments()[0];
      if (
        argument === undefined ||
        (!argument.getText().startsWith("'") && !argument.getText().startsWith('"'))
      )
        continue;
      const specifier = argument.getText().slice(1, -1);
      if (expression.getKindName() === 'ImportKeyword') {
        dependencies.push(
          this.candidate(sourcePath, specifier, 'dynamic-import', call.getStartLineNumber()),
        );
      } else if (expression.getText() === 'require') {
        dependencies.push(
          this.candidate(sourcePath, specifier, 'require', call.getStartLineNumber()),
        );
      }
    }
    return dependencies.sort(
      (a, b) => a.line - b.line || a.targetSpecifier.localeCompare(b.targetSpecifier),
    );
  }

  private candidate(
    sourcePath: string,
    targetSpecifier: string,
    type: DependencyKind,
    line: number,
  ): DependencyCandidate {
    return { sourcePath, targetSpecifier, type, line };
  }

  private getScriptKind(filePath: string): ScriptKind {
    if (filePath.endsWith('.tsx')) return ScriptKind.TSX;
    if (filePath.endsWith('.jsx')) return ScriptKind.JSX;
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs'))
      return ScriptKind.JS;
    return ScriptKind.TS;
  }
}

export default AstParser;
