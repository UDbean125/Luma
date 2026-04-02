import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { pool, query, queryOne } from '../db/pool';
import { analyzeVideo } from '../services/analysis';
import { DEMO_VIDEOS } from '../services/demo';
import {
  VideoRow,
  DetectionRow,
  VideoResponse,
  SceneAnalysisResponse,
} from '../types';

const router = Router();
const DEMO_FALLBACK = process.env.ENABLE_DEMO_FALLBACK === 'true';
const PUBLIC_API_BASE = process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

// ─── File Upload Setup ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}`));
    }
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatVideo(row: VideoRow, analysis?: SceneAnalysisResponse): VideoResponse {
  return {
    id: row.id,
    filename: row.filename,
    displayName: row.display_name,
    status: row.status,
    uploadedAt: row.uploaded_at,
    ...(row.processed_at   && { processedAt: row.processed_at }),
    ...(row.duration       && { duration: row.duration }),
    ...(row.media_url      && { mediaUrl: `${PUBLIC_API_BASE}${row.media_url}` }),
    ...(row.thumbnail_url  && { thumbnailUrl: `${PUBLIC_API_BASE}${row.thumbnail_url}` }),
    ...(analysis           && { analysis }),
  };
}

async function buildAnalysis(videoId: string): Promise<SceneAnalysisResponse | undefined> {
  const video = await queryOne<VideoRow>('SELECT * FROM videos WHERE id = $1', [videoId]);
  if (!video || video.status !== 'processed') return undefined;

  const detections = await query<DetectionRow>(
    'SELECT * FROM detections WHERE video_id = $1 ORDER BY timestamp ASC',
    [videoId]
  );

  return {
    videoId,
    processedAt: video.processed_at ?? video.uploaded_at,
    totalDetections: detections.length,
    detections: detections.map(d => ({
      id: d.id,
      label: d.label,
      category: d.category,
      confidence: Number(d.confidence),
      timestamp: d.timestamp,
    })),
  };
}

// ─── GET /health ──────────────────────────────────────────────────────────────
router.get('/health', async (_req: Request, res: Response) => {
  let dbConnected = false;
  try {
    await pool.query('SELECT 1');
    dbConnected = true;
  } catch {}

  res.json({
    ok: dbConnected,
    databaseConfigured: !!process.env.DATABASE_URL,
    databaseConnected: dbConnected,
    demoFallback: DEMO_FALLBACK,
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /videos ──────────────────────────────────────────────────────────────
router.get('/videos', async (_req: Request, res: Response) => {
  try {
    const rows = await query<VideoRow>(
      'SELECT * FROM videos ORDER BY uploaded_at DESC'
    );

    if (rows.length === 0 && DEMO_FALLBACK) {
      return res.json(DEMO_VIDEOS);
    }

    // Attach analysis to processed videos
    const videos: VideoResponse[] = await Promise.all(
      rows.map(async row => {
        const analysis = row.status === 'processed'
          ? await buildAnalysis(row.id)
          : undefined;
        return formatVideo(row, analysis);
      })
    );

    res.json(videos);
  } catch (err) {
    if (DEMO_FALLBACK) return res.json(DEMO_VIDEOS);
    throw err;
  }
});

// ─── POST /videos ─────────────────────────────────────────────────────────────
router.post('/videos', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { originalname, filename } = req.file;
  const displayName = originalname
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const [row] = await query<VideoRow>(
    `INSERT INTO videos (filename, display_name, status, media_url)
     VALUES ($1, $2, 'uploaded', $3)
     RETURNING *`,
    [originalname, displayName, `/uploads/${filename}`]
  );

  res.status(201).json(formatVideo(row));
});

// ─── GET /videos/:id ─────────────────────────────────────────────────────────
router.get('/videos/:id', async (req: Request, res: Response) => {
  const row = await queryOne<VideoRow>('SELECT * FROM videos WHERE id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Video not found' });

  const analysis = row.status === 'processed'
    ? await buildAnalysis(row.id)
    : undefined;

  res.json(formatVideo(row, analysis));
});

// ─── POST /videos/:id/process ─────────────────────────────────────────────────
router.post('/videos/:id/process', async (req: Request, res: Response) => {
  const row = await queryOne<VideoRow>('SELECT * FROM videos WHERE id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Video not found' });

  if (row.status === 'processing') {
    return res.status(409).json({ error: 'Already processing' });
  }

  // Mark as processing immediately
  await query(
    `UPDATE videos SET status = 'processing' WHERE id = $1`,
    [row.id]
  );

  res.json({ ok: true, status: 'processing', videoId: row.id });

  // Run analysis in background
  setImmediate(async () => {
    try {
      const videoPath = path.join(UPLOADS_DIR, path.basename(row.media_url ?? ''));
      const duration = row.duration ?? 120;
      const detections = await analyzeVideo(videoPath, duration);

      // Insert detections
      for (const det of detections) {
        await query(
          `INSERT INTO detections (id, video_id, label, category, confidence, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [det.id, row.id, det.label, det.category, det.confidence, det.timestamp]
        );
      }

      // Mark as processed
      await query(
        `UPDATE videos SET status = 'processed', processed_at = NOW() WHERE id = $1`,
        [row.id]
      );

      console.log(`✅ Processed video ${row.id}: ${detections.length} detections`);
    } catch (err) {
      console.error(`❌ Processing failed for video ${row.id}:`, err);
      await query(
        `UPDATE videos SET status = 'error', error_message = $1 WHERE id = $2`,
        [String(err), row.id]
      );
    }
  });
});

// ─── GET /scene-analysis/:videoId ─────────────────────────────────────────────
router.get('/scene-analysis/:videoId', async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (videoId === 'demo') {
    const demo = DEMO_VIDEOS.find(v => v.analysis);
    return res.json(demo?.analysis ?? DEMO_VIDEOS[0].analysis);
  }

  try {
    const analysis = await buildAnalysis(videoId);
    if (!analysis) {
      return res.status(404).json({ error: 'No analysis found for this video' });
    }
    res.json(analysis);
  } catch (err) {
    if (DEMO_FALLBACK) {
      return res.json(DEMO_VIDEOS[0].analysis);
    }
    throw err;
  }
});

// ─── DELETE /videos/:id ───────────────────────────────────────────────────────
router.delete('/videos/:id', async (req: Request, res: Response) => {
  const row = await queryOne<VideoRow>('SELECT * FROM videos WHERE id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Video not found' });

  // Delete file from disk
  if (row.media_url) {
    const filePath = path.join(UPLOADS_DIR, path.basename(row.media_url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Cascade deletes detections via FK
  await query('DELETE FROM videos WHERE id = $1', [req.params.id]);

  res.json({ ok: true, deleted: req.params.id });
});

// ─── Serve uploaded files ─────────────────────────────────────────────────────
router.use('/uploads', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

export default router;
