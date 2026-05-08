export interface AppConfig {
  port: number
  host: string
  jwtSecret: string
  jwtExpiresIn: string
  dataDir: string
  uploadsDir: string
  dbPath: string
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'meme-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '72h',
  dataDir: process.env.DATA_DIR || './data',
  uploadsDir: process.env.UPLOADS_DIR || './data/uploads',
  dbPath: process.env.DB_PATH || './data/meme.db',
}
