import path from "path";
import { readFile, stat } from "fs/promises";

export class SecurityService {
  validatePath(filePath: string, allowedDir: string): boolean {
    const resolved = path.resolve(allowedDir, filePath);
    const normalizedAllowed = path.resolve(allowedDir);
    return resolved.startsWith(normalizedAllowed + path.sep) || resolved === normalizedAllowed;
  }

  async validateProductImage(filePath: string): Promise<{ valid: boolean; error?: string }> {
    // Path boundary: must be within .ai-poster-creation directory
    const root = process.env.AI_POSTER_PROJECT_ROOT || process.cwd();
    const stateDir = path.join(root, ".ai-poster-creation");
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(stateDir)) {
      return { valid: false, error: "Invalid file path" };
    }

    // Size check: ≤ 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    let fileSize: number;
    try {
      const info = await stat(resolved);
      fileSize = info.size;
    } catch {
      return { valid: false, error: "File does not exist" };
    }
    if (fileSize > MAX_SIZE) {
      return { valid: false, error: "File size exceeds 10MB limit" };
    }
    if (fileSize === 0) {
      return { valid: false, error: "File is empty" };
    }

    // Magic bytes validation
    const buf = await readFile(resolved);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isWebP = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
    if (!isPng && !isJpeg && !isWebP) {
      return { valid: false, error: "Invalid image format" };
    }

    return { valid: true };
  }

  getApiKey(): string {
    const key = process.env.ARK_API_KEY;
    if (!key) {
      throw new Error("ARK_API_KEY environment variable is not set");
    }
    return key;
  }

  isAllowedDomain(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname === "ark.cn-beijing.volces.com";
    } catch {
      return false;
    }
  }

  sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...obj };
    if (sanitized.apiKey) sanitized.apiKey = "***";
    if (sanitized.ARK_API_KEY) sanitized.ARK_API_KEY = "***";
    return sanitized;
  }
}
