import { DetectionResponse } from '../types';

// ─── Category keywords for basic classification ───────────────────────────────
const CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  { keywords: ['shirt','tee','trousers','pants','dress','jacket','coat','sweater','hoodie','jeans','skirt','shorts','blouse','suit','blazer','shoes','boots','sneakers','heels','espadrilles','sandals','apron'], category: 'apparel' },
  { keywords: ['bag','tote','purse','wallet','belt','hat','sunglasses','earrings','necklace','bracelet','ring','watch','scarf','gloves','crossbody','backpack','clutch'], category: 'accessories' },
  { keywords: ['moisturiser','moisturizer','serum','lipstick','gloss','mascara','foundation','concealer','blush','eyeshadow','perfume','cologne','skincare','sunscreen','spf','cream','lotion','toner'], category: 'beauty' },
  { keywords: ['table','chair','lamp','candle','vase','rug','pillow','blanket','kettle','mug','plate','bowl','pan','knife','cutting board','rolling pin','canister','mat','thermometer','grinder'], category: 'home goods' },
  { keywords: ['phone','laptop','camera','tripod','ring light','earbuds','headphones','speaker','tablet','keyboard','mouse','charger','cable','microphone','gimbal'], category: 'tech' },
];

function classifyLabel(label: string): string {
  const lower = label.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return rule.category;
    }
  }
  return 'other';
}

// ─── Placeholder analysis ─────────────────────────────────────────────────────
// This is where you plug in a real vision model (Claude Vision, GPT-4V, Replicate, etc.)
// For now it returns a realistic placeholder so the full pipeline works end-to-end.

export async function analyzeVideo(
  videoPath: string,
  durationSeconds: number
): Promise<DetectionResponse[]> {
  // TODO: Replace with real AI analysis
  // Options:
  //   - Send frames to Claude claude-opus-4-6 with vision
  //   - Use Replicate with a vision model
  //   - Use AWS Rekognition
  //   - Use Google Video Intelligence API

  console.log(`[analyzeVideo] Analyzing: ${videoPath} (${durationSeconds}s)`);

  // Simulate processing time proportional to video length
  const delay = Math.min(durationSeconds * 100, 5000);
  await new Promise(r => setTimeout(r, delay));

  // Generate placeholder detections spaced through the video
  const placeholderItems = [
    { label: 'Detected Item 1', category: 'apparel' },
    { label: 'Detected Item 2', category: 'accessories' },
    { label: 'Detected Item 3', category: 'home goods' },
    { label: 'Detected Item 4', category: 'tech' },
    { label: 'Detected Item 5', category: 'beauty' },
  ];

  const count = Math.min(placeholderItems.length, Math.max(1, Math.floor(durationSeconds / 30)));
  const detections: DetectionResponse[] = [];

  for (let i = 0; i < count; i++) {
    const item = placeholderItems[i % placeholderItems.length];
    detections.push({
      id: `det-${Date.now()}-${i}`,
      label: item.label,
      category: item.category,
      confidence: 0.85 + Math.random() * 0.14,
      timestamp: Math.floor((durationSeconds / (count + 1)) * (i + 1)),
    });
  }

  return detections;
}
