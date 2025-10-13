
import { useStore } from '@/lib/store';

export default function Controls() {
  const {
    controls,
    setControls,
    modelScale,
    setModelScale,
    resetModel,
  } = useStore();
  
  return (
    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg space-y-4 z-10">
      <div>
        <h3 className="font-semibold mb-2">Controls</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setControls('gestures')}
            className={`px-3 py-1 rounded ${
              controls === 'gestures'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            👋 Gestures
          </button>
          <button
            onClick={() => setControls('mouse')}
            className={`px-3 py-1 rounded ${
              controls === 'mouse'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🖱️ Mouse
          </button>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium block mb-1">
          Scale: {modelScale.toFixed(2)}x
        </label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={modelScale}
          onChange={(e) => setModelScale(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      
      <button
        onClick={resetModel}
        className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Reset Position
      </button>
      
      {controls === 'gestures' && (
        <div className="text-xs text-gray-600 space-y-1">
          <p>✋ <strong>Palm:</strong> Rotate</p>
          <p>👌 <strong>Pinch:</strong> Scale</p>
          <p>☝️ <strong>Point:</strong> Move</p>
          <p>✊ <strong>Fist:</strong> Reset</p>
          <p>👍 <strong>Thumbs Up:</strong> Confirm</p>
        </div>
      )}
    </div>
  );
}
