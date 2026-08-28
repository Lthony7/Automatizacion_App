/*
 * S3 Storage Service — Content Automation Platform
 *
 * S3-compatible object storage for media assets (video, audio, images).
 * Falls back to local filesystem (/tmp/storage) when S3 env vars are not set.
 *
 * @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner are OPTIONAL dependencies.
 * They are only loaded at runtime when S3 env vars are present.
 */

import { createHash } from 'crypto';
import { createWriteStream, mkdirSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export interface StorageUploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  checksum: string;
}

export interface StorageProvider {
  upload(key: string, buffer: Buffer, contentType: string): Promise<StorageUploadResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSec?: number): Promise<string>;
  getPublicUrl(key: string): string;
}

/** Local filesystem fallback — uses /tmp/storage/{tenantId}/ */
class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor(baseDir = '/tmp/storage') {
    this.baseDir = baseDir;
    mkdirSync(baseDir, { recursive: true });
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    const fullPath = join(this.baseDir, key);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    mkdirSync(dir, { recursive: true });

    const ws = createWriteStream(fullPath);
    await pipeline(Readable.from(buffer), ws);

    const checksum = createHash('sha256').update(buffer).digest('hex');

    return { key, url: `file://${fullPath}`, size: buffer.length, contentType, checksum };
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = join(this.baseDir, key);
    if (!existsSync(fullPath)) throw new Error(`Storage key not found: ${key}`);
    return readFileSync(fullPath);
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.baseDir, key);
    if (existsSync(fullPath)) unlinkSync(fullPath);
  }

  async getSignedUrl(key: string): Promise<string> {
    return `file://${join(this.baseDir, key)}`;
  }

  getPublicUrl(key: string): string {
    return `file://${join(this.baseDir, key)}`;
  }
}

/** S3-compatible storage provider. AWS SDK loaded dynamically at runtime only. */
class S3StorageProvider implements StorageProvider {
  private client: any;
  private bucket: string;
  private endpoint: string;
  private cmds: any;
  private presigner: any;

  constructor() {
    this.bucket = process.env.S3_BUCKET!;
    this.endpoint = process.env.S3_ENDPOINT || `https://${this.bucket}.s3.amazonaws.com`;
  }

  private async ensureInit() {
    if (this.client) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const s3 = require('@aws-sdk/client-s3');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const presigner = require('@aws-sdk/s3-request-presigner');

      this.client = new s3.S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || '',
          secretAccessKey: process.env.S3_SECRET_KEY || '',
        },
      });
      this.cmds = s3;
      this.presigner = presigner;
    } catch {
      throw new Error('S3 storage requires @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner. Run: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner');
    }
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    await this.ensureInit();
    await this.client.send(new this.cmds.PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType,
    }));
    const checksum = createHash('sha256').update(buffer).digest('hex');
    return { key, url: `${this.endpoint}/${key}`, size: buffer.length, contentType, checksum };
  }

  async download(key: string): Promise<Buffer> {
    await this.ensureInit();
    const res = await this.client.send(new this.cmds.GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const chunks: Buffer[] = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.ensureInit();
    await this.client.send(new this.cmds.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getSignedUrl(key: string, expiresInSec = 3600): Promise<string> {
    await this.ensureInit();
    const cmd = new this.cmds.GetObjectCommand({ Bucket: this.bucket, Key: key });
    return this.presigner.getSignedUrl(this.client, cmd, { expiresIn: expiresInSec });
  }

  getPublicUrl(key: string): string {
    return `${this.endpoint}/${key}`;
  }
}

/** Factory: returns S3 provider when env vars are set, local filesystem otherwise. */
export function createStorageProvider(): StorageProvider {
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY) {
    console.log('[storage] Using S3 provider');
    return new S3StorageProvider();
  }
  console.log('[storage] Using local filesystem fallback (/tmp/storage)');
  return new LocalStorageProvider();
}

/** Tenant-scoped key prefix: `{tenantId}/{type}/{filename}` */
export function tenantKey(tenantId: string, type: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${tenantId}/${type}/${safe}`;
}
