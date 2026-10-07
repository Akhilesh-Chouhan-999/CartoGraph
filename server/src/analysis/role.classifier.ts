import type { FileRole } from './analysis.types.js';

class RoleClassifier {
  public classify(filePath: string): FileRole {
    const lower = filePath.toLowerCase();
    if (/\.test\.[cm]?[jt]sx?$/.test(lower) || /\.spec\.[cm]?[jt]sx?$/.test(lower)) return 'test';
    if (lower.endsWith('.controller.ts') || lower.endsWith('.controller.js')) return 'controller';
    if (lower.endsWith('.service.ts') || lower.endsWith('.service.js')) return 'service';
    if (lower.endsWith('.repository.ts') || lower.endsWith('.repository.js')) return 'repository';
    if (lower.endsWith('.model.ts') || lower.endsWith('.model.js')) return 'model';
    if (lower.endsWith('.middleware.ts') || lower.endsWith('.middleware.js')) return 'middleware';
    if (lower.endsWith('.config.ts') || lower.endsWith('.config.js')) return 'config';
    if (lower.split('/').includes('routes')) return 'entry';
    if (/(^|\/)(utils?|helpers?)(\/|$)/.test(lower)) return 'utility';
    return 'unknown';
  }
}

export default RoleClassifier;
