
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { generate3DModel } from '@/lib/3d-generation';
import ARView from '@/components/ARView';
import Controls from '@/components/Controls';
import GestureDetector from '@/components/GestureDetector';
import LoadingSpinner from '@/components/LoadingSpinner';

function ARContent() {
  const searchParams = useSearchParams();
  const {
    modelUrl,
    setModelUrl,
    isGenerating,
    setIsGenerating,
    generationError,
    setGenerationError,
    generationProgress,
    setGenerationProgress,
    setPrompt,
  } = useStore();
  
  useEffect(() => {
    const promptParam = searchParams.get('prompt');
    const imageUrlParam = searchParams.get('imageUrl');
    
    if (!promptParam && !imageUrlParam) return;
    if (modelUrl) return;
    
    const generateModel = async () => {
      setIsGenerating(true);
      setGenerationError(null);

      try {
        const response = await fetch('/api/generate-3d', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptParam, imageUrl: imageUrlParam }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to generate model.');
        }

        const result = await response.json();
        setModelUrl(result.modelUrl);
      } catch (error) {
        setGenerationError(
          error instanceof Error ? error.message : 'Generation failed'
        );
      } finally {
        setIsGenerating(false);
      }
    };
    
    generateModel();
  }, [searchParams, modelUrl, setModelUrl, setIsGenerating, setGenerationError, setGenerationProgress, setPrompt]);
  
  return (
    <div className="w-full h-screen relative">
      {isGenerating && (
        <LoadingSpinner 
          progress={generationProgress}
          message="Generating 3D model for AR..."
        />
      )}
      
      {generationError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-2">Generation Error</h3>
            <p className="text-gray-700">{generationError}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </div>
      )}
      
      {!isGenerating && modelUrl && (
        <>
          <ARView />
          <Controls />
          <GestureDetector />
        </>
      )}
    </div>
  );
}

export default function ARPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading AR..." />}>
      <ARContent />
    </Suspense>
  );
}
