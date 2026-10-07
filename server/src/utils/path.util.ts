import path from 'node:path';

export class PathUtil {
  public normalize(value: string): string {
    return path.posix.normalize(value.replaceAll('\\', '/')).replace(/^\.\//, '');
  }
}

export default PathUtil;
