
import { create } from 'zustand';

interface AppState {
  // Model generation
  prompt: string;
  setPrompt: (prompt: string) => void;
  
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  
  modelUrl: string | null;
  setModelUrl: (url: string | null) => void;
  
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
  
  generationError: string | null;
  setGenerationError: (error: string | null) => void;
  
  generationProgress: number;
  setGenerationProgress: (progress: number) => void;
  
  // Display settings
  mode: 'viewport' | 'ar';
  setMode: (mode: 'viewport' | 'ar') => void;
  
  controls: 'mouse' | 'gestures';
  setControls: (controls: 'mouse' | 'gestures') => void;
  
  // Model manipulation
  modelScale: number;
  setModelScale: (scale: number) => void;
  
  modelRotation: [number, number, number];
  setModelRotation: (rotation: [number, number, number]) => void;
  
  modelPosition: [number, number, number];
  setModelPosition: (position: [number, number, number]) => void;
  
  resetModel: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Model generation
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),
  
  imageUrl: null,
  setImageUrl: (imageUrl) => set({ imageUrl }),
  
  modelUrl: null,
  setModelUrl: (modelUrl) => set({ modelUrl }),
  
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  generationError: null,
  setGenerationError: (generationError) => set({ generationError }),
  
  generationProgress: 0,
  setGenerationProgress: (generationProgress) => set({ generationProgress }),
  
  // Display settings
  mode: 'viewport',
  setMode: (mode) => set({ mode }),
  
  controls: 'gestures',
  setControls: (controls) => set({ controls }),
  
  // Model manipulation
  modelScale: 1,
  setModelScale: (modelScale) => set({ modelScale }),
  
  modelRotation: [0, 0, 0],
  setModelRotation: (modelRotation) => set({ modelRotation }),
  
  modelPosition: [0, 0, 0],
  setModelPosition: (modelPosition) => set({ modelPosition }),
  
  resetModel: () => set({
    modelScale: 1,
    modelRotation: [0, 0, 0],
    modelPosition: [0, 0, 0],
  }),
}));
