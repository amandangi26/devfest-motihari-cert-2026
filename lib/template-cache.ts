import prisma from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

let cachedTemplateBytes: Uint8Array | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

export function invalidateTemplateCache() {
  cachedTemplateBytes = null;
  lastCacheTime = 0;
}

export function setTemplateBytes(bytes: Uint8Array) {
  cachedTemplateBytes = bytes;
  lastCacheTime = Date.now();
}

export async function getTemplateBytes(): Promise<Uint8Array> {
  const now = Date.now();
  if (cachedTemplateBytes && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedTemplateBytes;
  }

  // 1. Try to get template from DB (Base64)
  try {
    const config = await prisma.config.findUnique({ where: { key: 'template_data' } });

    if (config && config.value) {
      cachedTemplateBytes = new Uint8Array(Buffer.from(config.value, 'base64'));
      lastCacheTime = now;
      return cachedTemplateBytes;
    }
  } catch (err) {
    console.warn('Could not read template from DB, trying filesystem fallback:', err);
  }

  // 2. Fallback to default file in public/uploads
  const defaultPath = path.join(process.cwd(), 'public', 'uploads', 'certificate_template.pdf');
  const fileBuffer = await fs.readFile(defaultPath);
  cachedTemplateBytes = new Uint8Array(fileBuffer);
  lastCacheTime = now;
  return cachedTemplateBytes;
}

export async function getTemplateInfo(): Promise<{
  isCustom: boolean;
  sizeBytes: number;
  updatedAt?: string;
}> {
  try {
    const config = await prisma.config.findUnique({ where: { key: 'template_data' } });
    if (config && config.value) {
      const buffer = Buffer.from(config.value, 'base64');
      return {
        isCustom: true,
        sizeBytes: buffer.length,
      };
    }
  } catch {
    // fallback check
  }

  try {
    const defaultPath = path.join(process.cwd(), 'public', 'uploads', 'certificate_template.pdf');
    const stat = await fs.stat(defaultPath);
    return {
      isCustom: false,
      sizeBytes: stat.size,
    };
  } catch {
    return {
      isCustom: false,
      sizeBytes: 0,
    };
  }
}
