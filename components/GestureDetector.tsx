
'use client';

import { useEffect, useRef } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { initializeHandTracking, detectGesture, GestureType } from '@/lib/gestures';
import { useStore } from '@/lib/store';

export default function GestureDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { controls, setModelRotation, setModelScale, resetModel } = useStore();
  
  const lastGestureRef = useRef<GestureType>('none');
  const gestureStartRef = useRef({ x: 0, y: 0, scale: 1 });
  
  useEffect(() => {
    if (controls !== 'gestures' || !videoRef.current) return;
    
    const hands = initializeHandTracking(videoRef.current, (results) => {
      const gesture = detectGesture(results);
      
      if (!gesture || gesture.gesture === 'none') {
        lastGestureRef.current = 'none';
        return;
      }
      
      // Draw landmarks on canvas
      if (canvasRef.current && results.multiHandLandmarks) {
        const ctx = canvasRef.current.getContext('2d')!;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Draw hand skeleton
        // (Simplified - full implementation would draw connections)
        for (const landmarks of results.multiHandLandmarks) {
          for (const landmark of landmarks) {
            ctx.beginPath();
            ctx.arc(
              landmark.x * canvasRef.current.width,
              landmark.y * canvasRef.current.height,
              5,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = '#00FF00';
            ctx.fill();
          }
        }
      }
      
      // Handle gesture actions
      const firstLandmark = gesture.landmarks?.[0];
      if (!firstLandmark) return;
      
      switch (gesture.gesture) {
        case 'palm':
          // Rotate model based on hand position
          if (lastGestureRef.current === 'palm') {
            const dx = firstLandmark.x - gestureStartRef.current.x;
            const dy = firstLandmark.y - gestureStartRef.current.y;
            setModelRotation([dy * Math.PI * 2, dx * Math.PI * 2, 0]);
          }
          gestureStartRef.current = { x: firstLandmark.x, y: firstLandmark.y, scale: 1 };
          break;
          
        case 'pinch':
          // Scale model
          if (lastGestureRef.current === 'pinch' && gesture.landmarks) {
            const thumb = gesture.landmarks[4];
            const index = gesture.landmarks[8];
            const distance = Math.sqrt(
              Math.pow(thumb.x - index.x, 2) + 
              Math.pow(thumb.y - index.y, 2)
            );
            const scale = Math.max(0.1, Math.min(3, distance * 10));
            setModelScale(scale);
          }
          break;
          
        case 'fist':
          // Reset model
          if (lastGestureRef.current !== 'fist') {
            resetModel();
          }
          break;
      }
      
      lastGestureRef.current = gesture.gesture;
    });
    
    // Start camera
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });
    
    camera.start();
    
    return () => {
      camera.stop();
      hands.close();
    };
  }, [controls, setModelRotation, setModelScale, resetModel]);
  
  if (controls !== 'gestures') return null;
  
  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="relative">
        <video 
          ref={videoRef} 
          className="w-48 h-36 bg-black rounded-lg"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas 
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-48 h-36"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>
      <p className="text-xs text-white bg-black/50 px-2 py-1 rounded mt-1">
        Camera feed for gesture detection
      </p>
    </div>
  );
}
