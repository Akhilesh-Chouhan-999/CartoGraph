import local from './local.js';

export { shared } from './shared/index.js';
export const lazy = import('./lazy.js');
// This fixture intentionally contains CommonJS syntax for the AST parser.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const legacy = require('./legacy.cjs');
export const externalPackage = import('external-package');
export const missing = import('./missing.js');
export const localValue = local;
