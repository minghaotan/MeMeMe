import { v4 as uuid } from 'uuid'
import path from 'node:path'
import fs from 'node:fs'
import { config } from '../config.js'
import * as mediaRepo from '../db/repositories/media.js'
import { AppError } from '../middleware/error-handler.js'
import type { MediaMetadata } from '@mememe/shared'

export function ensureUploadsDir(): void {
  if (!fs.existsSync(config.uploadsDir)) {
    fs.mkdirSync(config.uploadsDir, { recursive: true })
  }
}

export function getFilePath(mediaId: string, ext: string): string {
  return path.join(config.uploadsDir, `${mediaId}${ext}`)
}

export async function saveMedia(
  userId: string,
  file: Express.Multer.File,
  isPublic: boolean,
  meta: MediaMetadata,
  tags: string[]
) {
  ensureUploadsDir()

  const id = uuid()
  const ext = path.extname(file.originalname)
  const filePath = getFilePath(id, ext)

  // Move file
  fs.writeFileSync(filePath, file.buffer)

  // Try to generate thumbnail for images
  let thumbnailId: string | null = null
  if (file.mimetype.startsWith('image/')) {
    try {
      const sharp = await import('sharp')
      thumbnailId = uuid()
      const thumbPath = getFilePath(thumbnailId, '.webp')
      await sharp.default(file.buffer)
        .resize(400, 400, { fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(thumbPath)
    } catch {
      // Thumbnail generation is best-effort
    }
  }

  return mediaRepo.createMedia({
    id,
    user_id: userId,
    filename: file.originalname,
    mime_type: file.mimetype,
    size_bytes: file.size,
    file_path: filePath,
    thumbnail_id: thumbnailId,
    is_public: isPublic ? 1 : 0,
    metadata: JSON.stringify(meta),
    tags: JSON.stringify(tags),
  })
}

export function getUserMedia(userId: string, offset: number, limit: number) {
  return mediaRepo.findMediaByUser(userId, offset, limit)
}

export function getPublicMedia(offset: number, limit: number) {
  const media = mediaRepo.findPublicMedia(offset, limit)
  const total = mediaRepo.countPublicMedia()
  return { media, total }
}

export function getMediaFile(mediaId: string, userId?: string): { filePath: string; mimeType: string } {
  const media = mediaRepo.findMediaById(mediaId)
  if (!media) {
    throw new AppError(404, 'Media not found')
  }
  // Allow access if public or owned by user
  if (media.is_public === 0 && media.user_id !== userId) {
    throw new AppError(403, 'Access denied')
  }
  return { filePath: media.file_path, mimeType: media.mime_type }
}

export function copyPublicMedia(mediaId: string, userId: string): void {
  const media = mediaRepo.findMediaById(mediaId)
  if (!media || media.is_public === 0) {
    throw new AppError(404, 'Public media not found')
  }
  if (media.user_id === userId) {
    return // owner doesn't need a copy
  }
  mediaRepo.makeMediaCopy(mediaId, userId, uuid())
}
