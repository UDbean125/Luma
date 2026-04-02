import { pool } from './pool';
import dotenv from 'dotenv';

dotenv.config();

const MIGRATION = `
  CREATE TABLE IF NOT EXISTS videos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename      TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'uploaded'
                  CHECK (status IN ('uploaded','processing','processed','error')),
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at  TIMESTAMPTZ,
    duration      INTEGER,
    media_url     TEXT,
    thumbnail_url TEXT,
    error_message TEXT
  );

  CREATE TABLE IF NOT EXISTS detections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    category    TEXT NOT NULL,
    confidence  NUMERIC(4,3) NOT NULL,
    timestamp   INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_detections_video_id ON detections(video_id);
  CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
  CREATE INDEX IF NOT EXISTS idx_videos_uploaded_at ON videos(uploaded_at DESC);
`;

async function migrate() {
  console.log('🗄  Running database migration...');
  try {
    await pool.query(MIGRATION);
    console.log('✅ Migration complete');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
