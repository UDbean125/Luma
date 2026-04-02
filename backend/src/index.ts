import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import 'express-async-errors';
import apiRouter from './routes/api';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/', apiRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err?.message ?? err);
  res.status(500).json({
    error: err?.message ?? 'Internal server error',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🎬 Luma Backend running
   Port:     ${PORT}
   Public:   ${process.env.PUBLIC_API_BASE_URL ?? `http://localhost:${PORT}`}
   DB:       ${process.env.DATABASE_URL ? '✅ configured' : '❌ NOT SET'}
   Demo:     ${process.env.ENABLE_DEMO_FALLBACK === 'true' ? '✅ on' : '❌ off'}
  `);
});

export default app;
