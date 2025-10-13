
export default function LoadingSpinner({ 
  progress = 0, 
  message = 'Loading...' 
}: { 
  progress?: number; 
  message?: string; 
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
            ></div>
          </div>
          
          {/* Message */}
          <p className="text-lg font-semibold text-gray-900">{message}</p>
          
          {/* Progress bar */}
          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          
          {/* Progress percentage */}
          {progress > 0 && (
            <p className="text-sm text-gray-600">{Math.round(progress)}%</p>
          )}
        </div>
      </div>
    </div>
  );
}
