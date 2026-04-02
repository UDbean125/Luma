# Luma Backend API

Node.js/Express backend for Luma Scene Intelligence.

## Stack
- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Database:** PostgreSQL
- **File storage:** Local disk (swap for S3/R2 in production)
- **Hosting:** Render (free tier)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + DB status |
| GET | `/videos` | List all videos with analysis |
| POST | `/videos` | Upload a video (multipart/form-data, field: `file`) |
| GET | `/videos/:id` | Get single video with analysis |
| POST | `/videos/:id/process` | Trigger scene analysis |
| GET | `/scene-analysis/:videoId` | Get analysis for a video |
| GET | `/scene-analysis/demo` | Get demo analysis |
| DELETE | `/videos/:id` | Delete video and all data |

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Run database migration
npm run db:migrate

# 4. Start dev server
npm run dev
```

## Deploy to Render (free)

1. Push this folder to a GitHub repo
2. Go to render.com → New → Blueprint
3. Connect the repo — Render reads `render.yaml` automatically
4. Set environment variables:
   - `PUBLIC_API_BASE_URL` = your Render service URL (e.g. `https://luma-api.onrender.com`)
   - `ALLOWED_ORIGINS` = your frontend URLs comma-separated
5. Deploy

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ✅ | Port to listen on (Render sets this automatically) |
| `PUBLIC_API_BASE_URL` | ✅ | Full public URL of this API (no trailing slash) |
| `ENABLE_DEMO_FALLBACK` | ❌ | Return demo data when DB is empty (default: false) |
| `ALLOWED_ORIGINS` | ❌ | CORS allowed origins, comma-separated |

## Wiring to the Frontend

Set this in your Expo app's EAS environment or `.env`:

```
EXPO_PUBLIC_SCENE_API_BASE_URL=https://luma-api.onrender.com
EXPO_PUBLIC_ENABLE_DEMO_FALLBACK=false
```

## Plugging in Real AI Analysis

Edit `src/services/analysis.ts` — the `analyzeVideo()` function is stubbed.
Replace the placeholder with any vision API:

- **Claude Vision** (Anthropic) — send video frames as base64 images
- **Replicate** — use a video understanding model
- **AWS Rekognition** — label detection on video
- **Google Video Intelligence API** — object tracking + labels
