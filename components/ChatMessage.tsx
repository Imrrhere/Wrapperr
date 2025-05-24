interface ChatHistory {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchData?: any;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
    icon?: string;
  }>;
  sourceCount?: number;
  searchQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  image?: string;
}

interface ChatMessageProps {
  message: ChatHistory;
  isLatest: boolean;
}

export default function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-4 animate-slideInRight">
        <div className="max-w-2xl">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl rounded-br-md px-5 py-3 shadow-lg transform transition-all duration-300 hover:shadow-xl hover:scale-105">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-right opacity-70 hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-slideInLeft">
      <div className="max-w-3xl w-full">
        {/* Assistant Avatar and Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 animate-float">
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 text-lg">WrapeR2</span>
            <span className="text-xs text-gray-500 opacity-70">{formatTime(message.timestamp)}</span>
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-white rounded-2xl rounded-tl-md shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-xl hover-card">
          <div className="p-5">
            {/* Main Answer */}
            <div className="prose prose-sm max-w-none">
              <div 
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                style={{ fontSize: '1rem', lineHeight: '1.7' }}
              >
                {message.content}
              </div>
            </div>

            {/* Source Count Badge */}
            {message.sourceCount && (
              <div className="mt-5 flex items-center gap-3">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md transform transition-all duration-300 hover:scale-105">
                  📊 {message.sourceCount} Sources
                </span>
                {message.sourceCount >= 5 && (
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md transform transition-all duration-300 hover:scale-105 animate-pulse">
                    ✅ Quality Verified
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sources Section */}
          {message.sources && message.sources.length > 0 && (
            <div className="border-t border-gray-100 p-5 bg-gradient-to-r from-gray-50 to-blue-50">
              <h4 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
                <span className="text-lg animate-bounce">🔗</span>
                Sources ({message.sources.length})
              </h4>
              
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {message.sources.slice(0, 6).map((source, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm transform transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:scale-105 animate-fadeIn"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3">
                      {source.icon && (
                        <img 
                          src={source.icon} 
                          alt="" 
                          className="w-5 h-5 mt-1 flex-shrink-0 rounded transition-transform duration-300 hover:scale-110"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm text-gray-800 truncate hover:text-blue-600 transition-colors">
                          {source.title}
                        </h5>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                          {source.snippet}
                        </p>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs underline mt-2 inline-block truncate max-w-full transform transition-all duration-300 hover:scale-105"
                        >
                          {source.url.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image if available */}
          {message.image && (
            <div className="border-t border-gray-100 p-5">
              <img
                src={message.image}
                alt="Related to the search query"
                className="w-full max-w-sm h-40 object-cover rounded-xl shadow-lg mx-auto transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 