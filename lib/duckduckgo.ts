export interface DuckDuckGoResponse {
  Abstract: string;
  AbstractText: string;
  AbstractSource: string;
  AbstractURL: string;
  Image: string;
  Heading: string;
  Answer: string;
  AnswerType: string;
  Definition: string;
  DefinitionSource: string;
  DefinitionURL: string;
  RelatedTopics: Array<{
    Text: string;
    FirstURL: string;
    Icon?: {
      URL: string;
    };
  }>;
  Results: Array<{
    Text: string;
    FirstURL: string;
  }>;
  Type: string;
  Redirect: string;
}

export interface ProcessedSource {
  title: string;
  url: string;
  snippet: string;
  icon?: string;
}

export interface ProcessedDuckDuckGoData {
  abstractText: string;
  abstractSource: string;
  abstractURL: string;
  image: string;
  heading: string;
  answer: string;
  definition: string;
  definitionSource: string;
  sources: ProcessedSource[];
  sourceCount: number;
  hasMinimumSources: boolean;
  searchQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Fetches data from DuckDuckGo's Instant Answer API with enhanced source collection
 * @param query - The search query
 * @returns Processed DuckDuckGo data with multiple sources
 */
export async function fetchDuckDuckGoData(query: string): Promise<ProcessedDuckDuckGoData> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WrapeR2-AI-Search/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data: DuckDuckGoResponse = await response.json();
    
    // Collect all available sources
    const sources: ProcessedSource[] = [];
    
    // Add main abstract source
    if (data.AbstractText && data.AbstractSource) {
      sources.push({
        title: data.AbstractSource,
        url: data.AbstractURL || '',
        snippet: data.AbstractText.substring(0, 200) + '...',
        icon: data.Image || undefined
      });
    }
    
    // Add definition source
    if (data.Definition && data.DefinitionSource) {
      sources.push({
        title: data.DefinitionSource,
        url: data.DefinitionURL || '',
        snippet: data.Definition.substring(0, 200) + '...',
      });
    }
    
    // Add related topics as sources
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 8).forEach(topic => {
        if (topic.Text && topic.FirstURL) {
          sources.push({
            title: extractTitleFromText(topic.Text),
            url: topic.FirstURL,
            snippet: topic.Text.substring(0, 200) + '...',
            icon: topic.Icon?.URL
          });
        }
      });
    }
    
    // Add regular results as sources
    if (data.Results && data.Results.length > 0) {
      data.Results.slice(0, 5).forEach(result => {
        if (result.Text && result.FirstURL) {
          sources.push({
            title: extractTitleFromText(result.Text),
            url: result.FirstURL,
            snippet: result.Text.substring(0, 200) + '...',
          });
        }
      });
    }

    // Remove duplicates based on URL
    const uniqueSources = sources.filter((source, index, self) => 
      index === self.findIndex(s => s.url === source.url)
    ).slice(0, 10); // Limit to top 10 sources

    const sourceCount = uniqueSources.length;
    const hasMinimumSources = sourceCount >= 5;
    
    // Determine search quality based on source count and content quality
    let searchQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (sourceCount >= 8 && data.AbstractText && data.Definition) {
      searchQuality = 'excellent';
    } else if (sourceCount >= 6 && (data.AbstractText || data.Definition)) {
      searchQuality = 'good';
    } else if (sourceCount >= 4) {
      searchQuality = 'fair';
    }
    
    const processedData: ProcessedDuckDuckGoData = {
      abstractText: data.AbstractText || '',
      abstractSource: data.AbstractSource || '',
      abstractURL: data.AbstractURL || '',
      image: data.Image || '',
      heading: data.Heading || '',
      answer: data.Answer || '',
      definition: data.Definition || '',
      definitionSource: data.DefinitionSource || '',
      sources: uniqueSources,
      sourceCount,
      hasMinimumSources,
      searchQuality
    };

    return processedData;
  } catch (error) {
    console.error('Error fetching DuckDuckGo data:', error);
    return {
      abstractText: '',
      abstractSource: '',
      abstractURL: '',
      image: '',
      heading: '',
      answer: '',
      definition: '',
      definitionSource: '',
      sources: [],
      sourceCount: 0,
      hasMinimumSources: false,
      searchQuality: 'poor'
    };
  }
}

/**
 * Extracts a clean title from DuckDuckGo text
 */
function extractTitleFromText(text: string): string {
  // Extract text before the first dash or hyphen
  const match = text.match(/^([^-—]+)/);
  if (match) {
    return match[1].trim();
  }
  
  // Fallback: take first 50 characters
  return text.substring(0, 50).trim() + (text.length > 50 ? '...' : '');
}

/**
 * Creates a context prompt for Claude based on multiple sources
 * @param data - Processed DuckDuckGo data with multiple sources
 * @param userQuery - Original user query
 * @returns Formatted context prompt
 */
export function createContextPrompt(data: ProcessedDuckDuckGoData, userQuery: string): string {
  if (!data.hasMinimumSources) {
    return `The user asked: "${userQuery}". Only ${data.sourceCount} sources were found (minimum 5 required for quality response). Please provide a helpful general response and mention that more comprehensive information might be available with a more specific query.`;
  }
  
  let context = `Based on ${data.sourceCount} sources (Quality: ${data.searchQuality.toUpperCase()}), please provide a comprehensive answer to: "${userQuery}"\n\n`;
  
  // Add main content
  if (data.abstractText) {
    context += `Primary Source (${data.abstractSource}): ${data.abstractText}\n\n`;
  }
  
  if (data.definition) {
    context += `Definition (${data.definitionSource}): ${data.definition}\n\n`;
  }
  
  if (data.answer) {
    context += `Direct Answer: ${data.answer}\n\n`;
  }
  
  // Add additional sources
  if (data.sources.length > 0) {
    context += `Additional Sources:\n`;
    data.sources.slice(0, 6).forEach((source, index) => {
      context += `${index + 1}. ${source.title}: ${source.snippet}\n`;
    });
  }
  
  context += `\nPlease synthesize this information into a clear, comprehensive answer. Mention that this response is based on ${data.sourceCount} verified sources.`;
  
  return context;
} 