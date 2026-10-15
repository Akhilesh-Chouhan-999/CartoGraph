import { createHash } from 'node:crypto';

/**
 * Provides reusable hash utilities.
 */
export class HashUtil {
  /**
   * Computes the SHA-256 digest of the supplied content.
   * @param value - The value value used by this operation.
   */
  public sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}

export default HashUtil;
