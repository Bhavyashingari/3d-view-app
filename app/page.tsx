'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'viewport' | 'ar'>('viewport');
  const router = useRouter();
  const { setPrompt: setStorePrompt, setMode: setStoreMode } = useStore();
  
  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    setStorePrompt(prompt);
    setStoreMode(mode);
    
    const url = `/${mode}?prompt=${encodeURIComponent(prompt)}`;
    router.push(url);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AR 3D Viewer
        </h1>
        <p className="text-gray-600 mb-8">
          Generate 3D models from text descriptions and view them in AR or traditional 3D viewport
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe what you want to create:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Iron Man Mark 42 armor, red sports car, wooden chair..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Mode:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('viewport')}
                className={`p-4 rounded-lg border-2 transition ${
                  mode === 'viewport'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-4xl mb-2">🖥️</div>
                <div className="font-semibold">Viewport</div>
                <div className="text-xs text-gray-600">Works on all devices</div>
              </button>
              
              <button
                onClick={() => setMode('ar')}
                className={`p-4 rounded-lg border-2 transition ${
                  mode === 'ar'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-4xl mb-2">📱</div>
                <div className="font-semibold">AR Mode</div>
                <div className="text-xs text-gray-600">Mobile recommended</div>
              </button>
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold text-lg
                       hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Generate 3D Model
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2"> Tips for best results:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be specific: &quot;red sports car&quot; not just &quot;car&quot;</li>
            <li>• Mention style: &quot;low poly tree&quot;, &quot;realistic robot&quot;</li>
            <li>• Include details: &quot;Iron Man Mark 42 armor, red and gold&quot;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}