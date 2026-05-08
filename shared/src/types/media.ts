// ---- Media / Family Cloud Types ----

export interface MediaItem {
  id: string
  userId: string // owner
  filename: string
  mimeType: string
  sizeBytes: number
  thumbnailId: string | null
  isPublic: boolean // visible to family cloud
  metadata: MediaMetadata
  tags: string[]
  createdAt: number
}

export interface MediaMetadata {
  width?: number
  height?: number
  duration?: number
  locationLat?: number
  locationLng?: number
  takenAt?: number // EXIF date
  description?: string
}

export interface MediaCopy {
  id: string
  mediaId: string
  userId: string // who obtained the public copy
  copiedAt: number
}
