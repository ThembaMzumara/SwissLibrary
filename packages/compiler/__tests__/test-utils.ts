import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

type WithTempFileCallback = (filePath: string) => Promise<void> | void;

export async function withTempFile(
  extension: string,
  content: string,
  callback: WithTempFileCallback
): Promise<void> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'swiss-compiler-'));
  const filePath = path.join(tempDir, `test${extension}`);
  
  try {
    await fs.writeFile(filePath, content, 'utf8');
    await callback(filePath);
  } finally {
    try {
      await fs.unlink(filePath);
      await fs.rmdir(tempDir);
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}
