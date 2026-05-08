import Database from 'better-sqlite3'
import { config } from '../config.js'
import { initSchema } from './migrations.js'
import fs from 'node:fs'
import path from 'node:path'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(config.dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new Database(config.dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
  }
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
  }
}
