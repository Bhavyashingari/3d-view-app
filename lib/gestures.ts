
import { Hands, Results, NormalizedLandmark } from '@mediapipe/hands';

export type GestureType = 
  | 'none' 
  | 'palm'      // All fingers extended - rotate model
  | 'pinch'     // Thumb + index close - scale model
  | 'point'     // Only index extended - move model
  | 'fist'      // All fingers closed - reset
  | 'thumbsup'; // Only thumb extended - confirm

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  handedness: 'Left' | 'Right';
  landmarks?: NormalizedLandmark[];
}

// Calculate 3D distance between two landmarks
function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + 
    Math.pow(a.y - b.y, 2) + 
    Math.pow(a.z - b.z, 2)
  );
}

// Check if finger is extended (comparing tip to knuckle)
function isFingerExtended(
  landmarks: NormalizedLandmark[], 
  tipIndex: number, 
  knuckleIndex: number
): boolean {
  return landmarks[tipIndex].y < landmarks[knuckleIndex].y;
}

// Detect gesture from hand landmarks
export function detectGesture(results: Results): GestureResult | null {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    return null;
  }
  
  const landmarks = results.multiHandLandmarks[0];
  const handedness = results.multiHandedness?.[0]?.label || 'Right';
  
  // Landmark indices (MediaPipe hand model)
  const THUMB_TIP = 4;
  const THUMB_IP = 3;
  const INDEX_TIP = 8;
  const INDEX_MCP = 5;
  const MIDDLE_TIP = 12;
  const MIDDLE_MCP = 9;
  const RING_TIP = 16;
  const RING_MCP = 13;
  const PINKY_TIP = 20;
  const PINKY_MCP = 17;
  
  // Check each finger state
  const thumbExtended = landmarks[THUMB_TIP].x < landmarks[THUMB_IP].x;
  const indexExtended = isFingerExtended(landmarks, INDEX_TIP, INDEX_MCP);
  const middleExtended = isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_MCP);
  const ringExtended = isFingerExtended(landmarks, RING_TIP, RING_MCP);
  const pinkyExtended = isFingerExtended(landmarks, PINKY_TIP, PINKY_MCP);
  
  const extendedCount = [
    thumbExtended,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
  ].filter(Boolean).length;
  
  // Detect pinch (thumb and index close together)
  const thumbIndexDistance = distance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
  const isPinching = thumbIndexDistance < 0.05;
  
  // Gesture recognition logic
  if (isPinching && !middleExtended && !ringExtended && !pinkyExtended) {
    return {
      gesture: 'pinch',
      confidence: 0.9,
      handedness: handedness as 'Left' | 'Right',
      landmarks,
    };
  }
  
  if (extendedCount === 5) {
    return {
      gesture: 'palm',
      confidence: 0.95,
      handedness: handedness as 'Left' | 'Right',
      landmarks,
    };
  }
  
  if (indexExtended && !thumbExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return {
      gesture: 'point',
      confidence: 0.9,
      handedness: handedness as 'Left' | 'Right',
      landmarks,
    };
  }
  
  if (extendedCount === 0) {
    return {
      gesture: 'fist',
      confidence: 0.85,
      handedness: handedness as 'Left' | 'Right',
      landmarks,
    };
  }
  
  if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return {
      gesture: 'thumbsup',
      confidence: 0.9,
      handedness: handedness as 'Left' | 'Right',
      landmarks,
    };
  }
  
  return {
    gesture: 'none',
    confidence: 0.5,
    handedness: handedness as 'Left' | 'Right',
    landmarks,
  };
}

// Initialize MediaPipe Hands
export function initializeHandTracking(
  videoElement: HTMLVideoElement,
  onResults: (results: Results) => void
): Hands {
  const hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    },
  });
  
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });
  
  hands.onResults(onResults);
  
  return hands;
}
