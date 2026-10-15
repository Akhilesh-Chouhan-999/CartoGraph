import { Project, ScriptKind, SyntaxKind } from 'ts-morph';

import type { DependencyCandidate, DependencyKind } from './analysis.types.js';

/**
 * Parses source code into structured analysis data.
 */
class AstParser {
  private readonly project = new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
  });

  /**
   * Parses source code and extracts dependency candidates with source locations.
   * @param sourcePath - The source path value used by this operation.
   * @param content - The content value used by this operation.
   */
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

  /**
   * Creates a dependency candidate with its source location.
   * @param sourcePath - The source path value used by this operation.
   * @param targetSpecifier - The target specifier value used by this operation.
   * @param type - The type value used by this operation.
   * @param line - The line value used by this operation.
   */
  private candidate(
    sourcePath: string,
    targetSpecifier: string,
    type: DependencyKind,
    line: number,
  ): DependencyCandidate {
    return { sourcePath, targetSpecifier, type, line };
  }

  /**
   * Selects the TypeScript parser mode for the source file extension.
   * @param filePath - The file path value used by this operation.
   */
  private getScriptKind(filePath: string): ScriptKind {
    if (filePath.endsWith('.tsx')) return ScriptKind.TSX;
    if (filePath.endsWith('.jsx')) return ScriptKind.JSX;
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs'))
      return ScriptKind.JS;
    return ScriptKind.TS;
  }
}

export default AstParser;
