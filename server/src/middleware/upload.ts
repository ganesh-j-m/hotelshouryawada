import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import sharp from 'sharp';
import { config } from '../config.js';
import { HttpError } from '../lib/errors.js';

/** Files stay in memory only long enough to be validated and re-encoded. */
export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
}).single('file');

/** Detect the real file type from magic bytes — the client-supplied mimetype is not trusted. */
function sniffImage(buf: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

export type UploadKind = 'branch' | 'menu' | 'gallery' | 'founder' | 'site';

/**
 * Validates, strips metadata (EXIF/GPS), resizes and re-encodes to WebP.
 * Re-encoding also neutralises polyglot files hiding scripts inside images.
 */
export async function saveImage(file: Express.Multer.File, kind: UploadKind) {
  if (!sniffImage(file.buffer)) {
    throw new HttpError(400, 'Only JPG, PNG or WebP images are allowed.');
  }

  const maxWidth = kind === 'gallery' || kind === 'site' || kind === 'branch' ? 2000 : 1200;
  let output: Buffer;
  let meta: sharp.OutputInfo;
  try {
    const result = await sharp(file.buffer, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    output = result.data;
    meta = result.info;
  } catch {
    throw new HttpError(400, 'This image could not be processed. Try a different file.');
  }

  const folder = path.join(config.uploadDir, kind);
  await fs.mkdir(folder, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`;
  await fs.writeFile(path.join(folder, filename), output);

  return {
    url: `${config.publicUploadBase}/${kind}/${filename}`,
    width: meta.width,
    height: meta.height,
    bytes: output.length,
  };
}

/** Removes a previously uploaded local file. Ignores external URLs. */
export async function deleteLocalImage(url?: string | null) {
  if (!url || !url.startsWith(`${config.publicUploadBase}/`)) return;
  const relative = url.slice(config.publicUploadBase.length + 1);
  const full = path.resolve(config.uploadDir, relative);
  if (!full.startsWith(config.uploadDir + path.sep)) return; // path traversal guard
  await fs.unlink(full).catch(() => undefined);
}
