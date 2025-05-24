export default function LoadingIndicator() {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Searching & Analyzing</h3>
            <p className="text-sm text-gray-600">Please wait while I find the best answer...</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Animated text lines */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
          </div>

          {/* Loading steps */}
          <div className="mt-8 space-y-3">
            <LoadingStep
              step="Searching DuckDuckGo"
              completed={false}
              current={true}
            />
            <LoadingStep
              step="Processing with Claude AI"
              completed={false}
              current={false}
            />
            <LoadingStep
              step="Generating response"
              completed={false}
              current={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingStepProps {
  step: string;
  completed: boolean;
  current: boolean;
}

function LoadingStep({ step, completed, current }: LoadingStepProps) {
  return (
    <div className="flex items-center space-x-3">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
        completed
          ? 'bg-green-500'
          : current
          ? 'bg-primary-500'
          : 'bg-gray-300'
      }`}>
        {completed ? (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : current ? (
          <div className="animate-spin rounded-full h-2 w-2 border-b border-white"></div>
        ) : null}
      </div>
      <span className={`text-sm ${
        completed
          ? 'text-green-600'
          : current
          ? 'text-primary-600'
          : 'text-gray-500'
      }`}>
        {step}
      </span>
    </div>
  );
} 