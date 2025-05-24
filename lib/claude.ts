import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeResponse {
  content: string;
  error?: string;
}

/**
 * Initializes the Anthropic client with API key from environment
 */
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured in environment variables');
  }
  
  return new Anthropic({
    apiKey: apiKey,
  });
}

/**
 * Calls Claude 3 Sonnet to summarize and respond to the user query
 * @param prompt - The formatted prompt with context from DuckDuckGo
 * @returns Claude's response
 */
export async function callClaude(prompt: string): Promise<ClaudeResponse> {
  try {
    const client = getAnthropicClient();
    
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the text content from the response
    if (response.content && response.content.length > 0) {
      const content = response.content[0];
      if (content.type === 'text') {
        return {
          content: content.text
        };
      }
    }
    
    throw new Error('Unexpected response format from Claude');

  } catch (error) {
    console.error('Error calling Claude API:', error);
    
    // Return a more specific error message
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return {
          content: '',
          error: 'Claude API key is not configured properly. Please check your environment variables.'
        };
      } else if (error.message.includes('rate limit')) {
        return {
          content: '',
          error: 'Rate limit exceeded. Please try again in a moment.'
        };
      } else {
        return {
          content: '',
          error: `Error communicating with Claude: ${error.message}`
        };
      }
    }
    
    return {
      content: '',
      error: 'An unexpected error occurred while processing your request.'
    };
  }
}

/**
 * Creates a system prompt for Claude to act as a helpful search assistant
 */
export function createSystemPrompt(): string {
  return `You are a helpful AI search assistant, similar to Perplexity AI. Your role is to:

1. Provide clear, accurate, and comprehensive answers based on the information provided
2. Cite sources when available
3. If no external information is provided, use your knowledge to give helpful responses
4. Keep responses concise but informative
5. Format your responses in a user-friendly way
6. Always be honest about the limitations of the information available

Please provide responses that are helpful, accurate, and easy to understand.`;
} 