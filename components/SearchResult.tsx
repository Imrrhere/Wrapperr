import Image from 'next/image';

interface SearchResultProps {
  answer: string;
  source?: {
    name: string;
    url: string;
  };
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
    icon?: string;
  }>;
  sourceCount?: number;
  searchQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  image?: string;
  query: string;
}

export default function SearchResult({ 
  answer, 
  source, 
  sources = [], 
  sourceCount = 0, 
  searchQuality, 
  image, 
  query 
}: SearchResultProps) {
  const getQualityColor = (quality?: string) => {
    const colors = {
      'excellent': 'text-green-600 bg-green-50 border-green-200',
      'good': 'text-blue-600 bg-blue-50 border-blue-200',
      'fair': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'poor': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[quality as keyof typeof colors] || colors.poor;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Query Header with Quality Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex-1">
              🔍 {query}
            </h2>
            {searchQuality && (
              <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getQualityColor(searchQuality)}`}>
                {searchQuality.toUpperCase()} QUALITY
              </div>
            )}
          </div>
          
          {/* Source Count Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              📊 {sourceCount} Sources Found
            </span>
            {sourceCount >= 5 && (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                ✅ Quality Verified
              </span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Answer Section */}
          <div className="lg:col-span-2">
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                style={{ fontSize: '1.1rem', lineHeight: '1.7' }}
              >
                {answer}
              </div>
            </div>

            {/* Primary Source */}
            {source && (
              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Primary Source</h3>
                <p className="text-blue-700 mb-2">{source.name}</p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline break-all"
                >
                  {source.url}
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image */}
            {image && (
              <div className="bg-gray-50 rounded-xl p-4">
                <img
                  src={image}
                  alt="Related to the search query"
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Multiple Sources Section */}
            {sources && sources.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">🔗</span>
                  Additional Sources ({sources.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sources.slice(0, 8).map((src, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 shadow-sm border">
                      <div className="flex items-start gap-3">
                        {src.icon && (
                          <img 
                            src={src.icon} 
                            alt="" 
                            className="w-4 h-4 mt-1 flex-shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-800 truncate">
                            {src.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {src.snippet}
                          </p>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs underline mt-1 inline-block truncate max-w-full"
                          >
                            {src.url.replace(/^https?:\/\//, '').split('/')[0]}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Quality Metrics */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-600">{sourceCount}</div>
                      <div className="text-xs text-gray-500">Total Sources</div>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600">
                        {searchQuality === 'excellent' ? '100%' : 
                         searchQuality === 'good' ? '75%' : 
                         searchQuality === 'fair' ? '50%' : '25%'}
                      </div>
                      <div className="text-xs text-gray-500">Reliability</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Badge */}
            {searchQuality && (
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getQualityColor(searchQuality)} border`}>
                  <span className="text-lg">
                    {searchQuality === 'excellent' ? '🏆' : 
                     searchQuality === 'good' ? '⭐' : 
                     searchQuality === 'fair' ? '👍' : '📝'}
                  </span>
                  <span className="font-semibold">{searchQuality.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Search Stats */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>
              Powered by <strong className="text-blue-600">WrapeR2</strong> • 
              Claude AI + DuckDuckGo
            </span>
            <span>
              {sourceCount >= 5 ? '✅ High Quality Result' : '⚠️ Limited Sources'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 