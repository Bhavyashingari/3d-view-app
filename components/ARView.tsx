
'use client';

import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { Suspense } from 'react';
import Model3D from './Model3D';
import { useStore } from '@/lib/store';

const xrStore = createXRStore();

export default function ARView() {
  const { modelUrl } = useStore();
  
  if (!modelUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No model loaded</p>
      </div>
    );
  }
  
  return (
    <>
      <button
        onClick={() => xrStore.enterAR()}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                   bg-blue-500 text-white px-8 py-4 rounded-lg text-xl font-bold z-20
                   hover:bg-blue-600 transition"
      >
        Enter AR Mode
      </button>
      
      <Canvas className="w-full h-full">
        <XR store={xrStore}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <Suspense fallback={null}>
            <Model3D url={modelUrl} />
          </Suspense>
        </XR>
      </Canvas>
    </>
  );
}
