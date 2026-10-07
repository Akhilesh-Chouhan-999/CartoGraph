import { createHash } from 'node:crypto';

export class HashUtil {
  public sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}

export default HashUtil;
