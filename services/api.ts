import { Video, SceneAnalysis, ApiHealthResponse } from '../types';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = process.env.EXPO_PUBLIC_SCENE_API_BASE_URL ?? '';
const DEMO_FALLBACK = process.env.EXPO_PUBLIC_ENABLE_DEMO_FALLBACK !== 'false';

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
export const DEMO_VIDEOS: Video[] = [
  {
    id: 'demo-1',
    filename: 'summer_haul_2026.mp4',
    displayName: 'Summer Haul 2026',
    status: 'processed',
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 2 + 120000).toISOString(),
    duration: 742,
    analysis: {
      videoId: 'demo-1',
      processedAt: new Date(Date.now() - 86400000 * 2 + 120000).toISOString(),
      totalDetections: 14,
      detections: [
        { id: 'd1',  label: 'Linen Wide-Leg Trousers',     category: 'apparel',     confidence: 0.97, timestamp: 12  },
        { id: 'd2',  label: 'Oversized Cotton Tee',         category: 'apparel',     confidence: 0.95, timestamp: 24  },
        { id: 'd3',  label: 'Minimalist Leather Tote',      category: 'accessories', confidence: 0.96, timestamp: 48  },
        { id: 'd4',  label: 'Platform Espadrilles',         category: 'apparel',     confidence: 0.91, timestamp: 67  },
        { id: 'd5',  label: 'Gold Hoop Earrings',           category: 'accessories', confidence: 0.98, timestamp: 89  },
        { id: 'd6',  label: 'SPF 50 Tinted Moisturiser',   category: 'beauty',      confidence: 0.94, timestamp: 112 },
        { id: 'd7',  label: 'Rattan Side Table',            category: 'home goods',  confidence: 0.88, timestamp: 145 },
        { id: 'd8',  label: 'Stripe Linen Shirt',           category: 'apparel',     confidence: 0.96, timestamp: 198 },
        { id: 'd9',  label: 'Woven Sun Hat',                category: 'accessories', confidence: 0.93, timestamp: 234 },
        { id: 'd10', label: 'Coral Lip Gloss',              category: 'beauty',      confidence: 0.97, timestamp: 278 },
        { id: 'd11', label: 'Mini Crossbody Bag',           category: 'accessories', confidence: 0.95, timestamp: 320 },
        { id: 'd12', label: 'Bamboo Serving Board',         category: 'home goods',  confidence: 0.89, timestamp: 390 },
        { id: 'd13', label: 'Ring Light Stand',             category: 'tech',        confidence: 0.99, timestamp: 445 },
        { id: 'd14', label: 'Wireless Earbuds',             category: 'tech',        confidence: 0.97, timestamp: 512 },
      ],
    },
  },
  {
    id: 'demo-2',
    filename: 'kitchen_tour.mp4',
    displayName: 'Kitchen Tour & Favourites',
    status: 'processed',
    uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 5 + 90000).toISOString(),
    duration: 523,
    analysis: {
      videoId: 'demo-2',
      processedAt: new Date(Date.now() - 86400000 * 5 + 90000).toISOString(),
      totalDetections: 9,
      detections: [
        { id: 'k1', label: 'Matte Black Pour-Over Kettle', category: 'home goods', confidence: 0.98, timestamp: 18  },
        { id: 'k2', label: 'Linen Apron',                  category: 'apparel',    confidence: 0.95, timestamp: 35  },
        { id: 'k3', label: 'Ceramic Canister Set',          category: 'home goods', confidence: 0.92, timestamp: 71  },
        { id: 'k4', label: 'Marble Rolling Pin',            category: 'home goods', confidence: 0.96, timestamp: 103 },
        { id: 'k5', label: 'Silicone Baking Mat',           category: 'home goods', confidence: 0.88, timestamp: 162 },
        { id: 'k6', label: 'Instant-Read Thermometer',      category: 'tech',       confidence: 0.94, timestamp: 221 },
        { id: 'k7', label: 'Copper Measuring Cups',         category: 'home goods', confidence: 0.91, timestamp: 287 },
        { id: 'k8', label: 'Leather Pot-Holder Mitt',       category: 'accessories',confidence: 0.89, timestamp: 356 },
        { id: 'k9', label: 'Rechargeable Spice Grinder',    category: 'tech',       confidence: 0.97, timestamp: 412 },
      ],
    },
  },
  {
    id: 'demo-3',
    filename: 'morning_routine.mp4',
    displayName: 'Morning Routine',
    status: 'processing',
    uploadedAt: new Date(Date.now() - 3600000).toISOString(),
    duration: 310,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatTs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

export { formatTs };

// ─── API LAYER ────────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<ApiHealthResponse> {
  if (!API_BASE) throw new Error('No API base URL configured');
  const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function fetchVideos(): Promise<Video[]> {
  if (!API_BASE) {
    if (DEMO_FALLBACK) return DEMO_VIDEOS;
    throw new Error('No API base URL configured');
  }
  try {
    const res = await fetch(`${API_BASE}/videos`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Failed to fetch videos: ${res.status}`);
    return res.json();
  } catch (err) {
    if (DEMO_FALLBACK) return DEMO_VIDEOS;
    throw err;
  }
}

export async function fetchSceneAnalysis(videoId: string): Promise<SceneAnalysis> {
  const demoVideo = DEMO_VIDEOS.find(v => v.id === videoId);
  if (!API_BASE) {
    if (DEMO_FALLBACK && demoVideo?.analysis) return demoVideo.analysis;
    throw new Error('No API base URL configured');
  }
  try {
    const res = await fetch(`${API_BASE}/scene-analysis/${videoId}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Failed to fetch analysis: ${res.status}`);
    return res.json();
  } catch (err) {
    if (DEMO_FALLBACK && demoVideo?.analysis) return demoVideo.analysis;
    throw err;
  }
}

export async function uploadVideo(uri: string, filename: string): Promise<Video> {
  if (!API_BASE) {
    if (DEMO_FALLBACK) {
      const mock: Video = {
        id: `upload-${Date.now()}`,
        filename,
        displayName: filename.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
        status: 'uploaded',
        uploadedAt: new Date().toISOString(),
      };
      return mock;
    }
    throw new Error('No API base URL configured');
  }
  const form = new FormData();
  form.append('file', { uri, name: filename, type: 'video/mp4' } as any);
  const res = await fetch(`${API_BASE}/videos`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function triggerProcessing(videoId: string): Promise<void> {
  if (!API_BASE) {
    if (DEMO_FALLBACK) return;
    throw new Error('No API base URL configured');
  }
  const res = await fetch(`${API_BASE}/videos/${videoId}/process`, {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Process trigger failed: ${res.status}`);
}

export async function deleteVideo(videoId: string): Promise<void> {
  if (!API_BASE) {
    if (DEMO_FALLBACK) return;
    throw new Error('No API base URL configured');
  }
  const res = await fetch(`${API_BASE}/videos/${videoId}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}
