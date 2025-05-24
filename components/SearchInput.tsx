import { useState, KeyboardEvent } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchInput({ onSearch, isLoading, placeholder = "Ask me anything...", disabled = false }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading && !disabled) {
      onSearch(query.trim());
      setQuery(''); // Clear input after submission for chat-like experience
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isInputDisabled = isLoading || disabled;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className={`flex items-end gap-4 bg-white rounded-2xl shadow-lg border-2 p-4 ${
          disabled 
            ? 'border-gray-200 bg-gray-50' 
            : isFocused 
              ? 'border-blue-400 shadow-xl' 
              : 'border-gray-200 hover:border-gray-300'
        }`}>
          {/* Text Area */}
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isInputDisabled}
            rows={1}
            className={`flex-1 resize-none outline-none placeholder-gray-400 bg-transparent max-h-32 min-h-[28px] overflow-y-auto text-base ${
              disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
            }`}
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 transparent'
            }}
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!query.trim() || isInputDisabled}
            className={`
              flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-semibold
              ${
                query.trim() && !isInputDisabled
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        
        {/* Hint Text */}
        <div className="mt-3 flex justify-between items-center text-xs opacity-70">
          <span className="text-gray-400 flex items-center gap-2">
            {disabled ? (
              <span className="text-red-500">Usage limit reached - upgrade to continue</span>
            ) : (
              <>
                <span className="hidden sm:inline">Press Enter to send, Shift + Enter for new line</span>
                <span className="sm:hidden">Enter to send</span>
                {query.trim() && (
                  <span>✨</span>
                )}
              </>
            )}
          </span>
          {query.length > 0 && !disabled && (
            <span className={`${
              query.length > 400 ? 'text-red-500 font-semibold' : 'text-gray-400'
            }`}>
              {query.length}/500
            </span>
          )}
        </div>
      </div>
    </form>
  );
} 