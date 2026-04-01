export type VideoStatus = 'uploaded' | 'processing' | 'processed' | 'error';

export interface Detection {
  id: string;
  label: string;
  category: string;
  confidence: number;
  timestamp: number; // seconds into video
  thumbnailUrl?: string;
}

export interface SceneAnalysis {
  videoId: string;
  detections: Detection[];
  processedAt: string;
  totalDetections: number;
}

export interface Video {
  id: string;
  filename: string;
  displayName: string;
  status: VideoStatus;
  uploadedAt: string;
  processedAt?: string;
  duration?: number; // seconds
  thumbnailUrl?: string;
  mediaUrl?: string;
  analysis?: SceneAnalysis;
}

export interface ApiHealthResponse {
  ok: boolean;
  databaseConfigured: boolean;
  databaseConnected: boolean;
}
