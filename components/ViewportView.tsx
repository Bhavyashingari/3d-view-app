
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import Model3D from './Model3D';
import { useStore } from '@/lib/store';

export default function ViewportView() {
  const { modelUrl, controls } = useStore();
  
  if (!modelUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No model loaded</p>
      </div>
    );
  }
  
  return (
    <Canvas className="w-full h-full">
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      <Suspense fallback={null}>
        <Model3D url={modelUrl} />
        <Environment preset="sunset" />
      </Suspense>
      
      {controls === 'mouse' && (
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      )}
    </Canvas>
  );
}
