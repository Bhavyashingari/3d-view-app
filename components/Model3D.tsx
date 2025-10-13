
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useStore } from '@/lib/store';
import * as THREE from 'three';

export default function Model3D({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);
  
  const { modelScale, modelRotation, modelPosition, controls } = useStore();
  
  // Auto-rotate if using gestures
  useFrame(() => {
    if (meshRef.current && controls === 'mouse') {
      meshRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <group ref={meshRef}>
      <primitive 
        object={scene} 
        scale={modelScale}
        rotation={modelRotation}
        position={modelPosition}
      />
    </group>
  );
}
