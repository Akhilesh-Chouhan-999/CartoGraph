import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import AstParser from '../src/analysis/ast.parser.js';
import DependencyResolver from '../src/analysis/dependency.resolver.js';

describe('dependency analysis', () => {
  it('uses repository fixtures for re-exports, dynamic imports, require, external and missing modules', async () => {
    const source = await readFile(
      new URL('./fixtures/repository/main.ts', import.meta.url),
      'utf8',
    );
    const candidates = new AstParser().parse('repository/main.ts', source);
    expect(candidates.map(({ type, targetSpecifier }) => [type, targetSpecifier])).toEqual([
      ['import', './local.js'],
      ['export', './shared/index.js'],
      ['dynamic-import', './lazy.js'],
      ['require', './legacy.cjs'],
      ['dynamic-import', 'external-package'],
      ['dynamic-import', './missing.js'],
    ]);
    const resolved = new DependencyResolver().resolve(
      candidates,
      new Set([
        'repository/main.ts',
        'repository/local.ts',
        'repository/shared/index.ts',
        'repository/lazy.ts',
      ]),
    );
    expect(resolved.map(({ targetPath }) => targetPath)).toEqual([
      'repository/lazy.ts',
      'repository/local.ts',
      'repository/shared/index.ts',
    ]);
  });

  it('extracts static, re-export, dynamic import, and require candidates', () => {
    const parser = new AstParser();
    const candidates = parser.parse(
      'src/main.ts',
      [
        "import value from './value';",
        "export * from '../shared';",
        "const lazy = import('./lazy');",
        "const legacy = require('./legacy');",
        "import external from 'external-package';",
      ].join('\n'),
    );
    expect(candidates.map(({ type, targetSpecifier }) => [type, targetSpecifier])).toEqual([
      ['import', './value'],
      ['export', '../shared'],
      ['dynamic-import', './lazy'],
      ['require', './legacy'],
      ['import', 'external-package'],
    ]);
  });

  it('resolves only internal files and common extension/index variants', () => {
    const resolver = new DependencyResolver();
    const candidates = [
      { sourcePath: 'src/main.ts', targetSpecifier: './utils', type: 'import' as const, line: 1 },
      { sourcePath: 'src/main.ts', targetSpecifier: './pages', type: 'import' as const, line: 2 },
      { sourcePath: 'src/main.ts', targetSpecifier: 'react', type: 'import' as const, line: 3 },
    ];
    const result = resolver.resolve(
      candidates,
      new Set(['src/main.ts', 'src/utils.ts', 'src/pages/index.tsx']),
    );
    expect(result.map(({ targetPath }) => targetPath)).toEqual([
      'src/pages/index.tsx',
      'src/utils.ts',
    ]);
  });
});
