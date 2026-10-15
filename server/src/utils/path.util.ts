import path from 'node:path';

/**
 * Provides reusable path utilities.
 */
export class PathUtil {
  /**
   * Normalizes a file path to a consistent repository-relative form.
   * @param value - The value value used by this operation.
   */
  public normalize(value: string): string {
    return path.posix.normalize(value.replaceAll('\\', '/')).replace(/^\.\//, '');
  }
}

export default PathUtil;
