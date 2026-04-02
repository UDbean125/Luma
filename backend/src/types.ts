export type VideoStatus = 'uploaded' | 'processing' | 'processed' | 'error';

export interface VideoRow {
  id: string;
  filename: string;
  display_name: string;
  status: VideoStatus;
  uploaded_at: string;
  processed_at: string | null;
  duration: number | null;
  media_url: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
}

export interface DetectionRow {
  id: string;
  video_id: string;
  label: string;
  category: string;
  confidence: number;
  timestamp: number;
  created_at: string;
}

// Shape the frontend expects
export interface VideoResponse {
  id: string;
  filename: string;
  displayName: string;
  status: VideoStatus;
  uploadedAt: string;
  processedAt?: string;
  duration?: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
  analysis?: SceneAnalysisResponse;
}

export interface DetectionResponse {
  id: string;
  label: string;
  category: string;
  confidence: number;
  timestamp: number;
}

export interface SceneAnalysisResponse {
  videoId: string;
  detections: DetectionResponse[];
  processedAt: string;
  totalDetections: number;
}
