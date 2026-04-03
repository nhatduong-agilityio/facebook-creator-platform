import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NotFoundError, ValidationError } from '@/shared/errors/errors';

export type StoredMediaKind = 'image' | 'video';

export type MediaUploadDto = {
  fileName: string;
  mimeType: string;
  base64Data: string;
};

const POST_MEDIA_ROUTE_PREFIX = '/api/v1/posts/media/';
const POST_MEDIA_DIRECTORY = path.resolve(process.cwd(), 'uploads', 'posts');
const MAX_MEDIA_UPLOAD_BYTES = 25 * 1024 * 1024;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm'
};

const EXTENSION_MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm'
};

export async function persistUploadedMedia(
  upload: MediaUploadDto
): Promise<string> {
  validateUploadedMedia(upload);

  const sanitizedBase64 = upload.base64Data.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(sanitizedBase64, 'base64');

  if (!buffer.length) {
    throw new ValidationError('Uploaded media file is empty');
  }

  if (buffer.length > MAX_MEDIA_UPLOAD_BYTES) {
    throw new ValidationError('Uploaded media exceeds the 25MB limit');
  }

  await fs.mkdir(POST_MEDIA_DIRECTORY, { recursive: true });

  const extension = resolveMediaExtension(upload.fileName, upload.mimeType);
  const storedFileName = `${randomUUID()}${extension}`;
  const absolutePath = path.join(POST_MEDIA_DIRECTORY, storedFileName);

  await fs.writeFile(absolutePath, buffer);

  return `${getApiPublicBaseUrl()}${POST_MEDIA_ROUTE_PREFIX}${storedFileName}`;
}

export async function deleteStoredMediaIfOwned(
  mediaUrl?: string | null
): Promise<void> {
  const file = resolveStoredMediaFile(mediaUrl);

  if (!file) {
    return;
  }

  try {
    await fs.unlink(file.absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function readStoredMediaFile(mediaUrl: string): Promise<{
  absolutePath: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  kind: StoredMediaKind | null;
}> {
  const file = resolveStoredMediaFile(mediaUrl);

  if (!file) {
    throw new NotFoundError('Uploaded media file was not found');
  }

  const buffer = await readBufferOrThrow(file.absolutePath);

  return {
    ...file,
    buffer
  };
}

export async function readStoredMediaFileByName(fileName: string): Promise<{
  absolutePath: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  kind: StoredMediaKind | null;
}> {
  const normalizedFileName = path.basename(fileName);

  if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(normalizedFileName)) {
    throw new NotFoundError('Uploaded media file was not found');
  }

  const extension = path.extname(normalizedFileName).toLowerCase();
  const mimeType = EXTENSION_MIME_MAP[extension] ?? 'application/octet-stream';
  const absolutePath = path.join(POST_MEDIA_DIRECTORY, normalizedFileName);
  const buffer = await readBufferOrThrow(absolutePath);

  return {
    absolutePath,
    fileName: normalizedFileName,
    mimeType,
    buffer,
    kind: inferMediaKindFromMimeType(mimeType)
  };
}

export function resolveStoredMediaFile(mediaUrl?: string | null): {
  absolutePath: string;
  fileName: string;
  mimeType: string;
  kind: StoredMediaKind | null;
} | null {
  if (!mediaUrl) {
    return null;
  }

  try {
    const url = new URL(mediaUrl);

    if (!url.pathname.startsWith(POST_MEDIA_ROUTE_PREFIX)) {
      return null;
    }

    const fileName = path.basename(url.pathname);

    if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(fileName)) {
      return null;
    }

    const extension = path.extname(fileName).toLowerCase();
    const mimeType =
      EXTENSION_MIME_MAP[extension] ?? 'application/octet-stream';
    const kind = inferMediaKindFromMimeType(mimeType);

    return {
      absolutePath: path.join(POST_MEDIA_DIRECTORY, fileName),
      fileName,
      mimeType,
      kind
    };
  } catch {
    return null;
  }
}

export function inferMediaKind(value?: string | null): StoredMediaKind | null {
  if (!value) {
    return null;
  }

  const stored = resolveStoredMediaFile(value);

  if (stored?.kind) {
    return stored.kind;
  }

  try {
    const url = new URL(value);
    const extension = path.extname(url.pathname).toLowerCase();
    const mimeType = EXTENSION_MIME_MAP[extension];
    return inferMediaKindFromMimeType(mimeType);
  } catch {
    return null;
  }
}

function validateUploadedMedia(upload: MediaUploadDto): void {
  if (!upload.fileName.trim()) {
    throw new ValidationError('Uploaded media file name is required');
  }

  const kind = inferMediaKindFromMimeType(upload.mimeType);

  if (!kind) {
    throw new ValidationError(
      'Only common image and video uploads are supported'
    );
  }
}

function resolveMediaExtension(fileName: string, mimeType: string): string {
  const fromName = path.extname(fileName).toLowerCase();

  if (EXTENSION_MIME_MAP[fromName]) {
    return fromName;
  }

  return MIME_EXTENSION_MAP[mimeType] ?? '.bin';
}

function inferMediaKindFromMimeType(
  mimeType?: string | null
): StoredMediaKind | null {
  if (!mimeType) {
    return null;
  }

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  return null;
}

function getApiPublicBaseUrl(): string {
  return (
    process.env.API_PUBLIC_URL ??
    `http://localhost:${process.env.PORT?.trim() || '3000'}`
  );
}

async function readBufferOrThrow(absolutePath: string): Promise<Buffer> {
  try {
    return await fs.readFile(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new NotFoundError('Uploaded media file was not found');
    }

    throw error;
  }
}
