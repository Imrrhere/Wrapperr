import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchDuckDuckGoData, createContextPrompt } from '../../lib/duckduckgo';
import { callClaude } from '../../lib/claude';
import { createSupabaseServerClientForAPI } from '../../lib/supabase';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  searchQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  sourceCount?: number;
}

interface ApiResponse {  success: boolean;  answer?: string;  source?: {    name: string;    url: string;  };  sources?: Array<{    title: string;    url: string;    snippet: string;    icon?: string;  }>;  sourceCount?: number;  searchQuality?: 'excellent' | 'good' | 'fair' | 'poor';  hasMinimumSources?: boolean;  image?: string;  error?: string;  creditsRemaining?: number;  creditsWarning?: string;  remainingQueries?: number;  isLimitReached?: boolean;}

/**
 * Creates a conversation-aware context prompt for Claude
 */
function createConversationPrompt(
  duckDuckGoData: any,
  userQuery: string,
  conversationHistory: ConversationMessage[]
): string {
  let prompt = '';

  // Add conversation context if available
  if (conversationHistory.length > 0) {
    prompt += `Previous conversation context:\n`;
    
    // Include last 6 messages for context (3 exchanges)
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      prompt += `${role}: ${msg.content}\n`;
      if (msg.searchQuality && msg.sourceCount) {
        prompt += `(Quality: ${msg.searchQuality}, Sources: ${msg.sourceCount})\n`;
      }
    });
    prompt += '\n';
  }

  // Add current search context
  if (!duckDuckGoData.hasMinimumSources) {
    prompt += `Current user question: "${userQuery}"\n`;
    prompt += `Only ${duckDuckGoData.sourceCount} sources were found (minimum 5 required for quality response).\n`;
    
    if (conversationHistory.length > 0) {
      prompt += `Based on our conversation history and limited new sources, please provide a helpful response that builds on previous context while mentioning that more comprehensive information might be available with a more specific query.\n`;
    } else {
      prompt += `Please provide a helpful general response and mention that more comprehensive information might be available with a more specific query.\n`;
    }
    
    return prompt;
  }

  // High-quality response with context
  prompt += `Current user question: "${userQuery}"\n`;
  prompt += `Based on ${duckDuckGoData.sourceCount} sources (Quality: ${duckDuckGoData.searchQuality.toUpperCase()}), please provide a comprehensive answer.\n\n`;
  
  // Add main content
  if (duckDuckGoData.abstractText) {
    prompt += `Primary Source (${duckDuckGoData.abstractSource}): ${duckDuckGoData.abstractText}\n\n`;
  }
  
  if (duckDuckGoData.definition) {
    prompt += `Definition (${duckDuckGoData.definitionSource}): ${duckDuckGoData.definition}\n\n`;
  }
  
  if (duckDuckGoData.answer) {
    prompt += `Direct Answer: ${duckDuckGoData.answer}\n\n`;
  }
  
  // Add additional sources
  if (duckDuckGoData.sources.length > 0) {
    prompt += `Additional Sources:\n`;
    duckDuckGoData.sources.slice(0, 6).forEach((source: any, index: number) => {
      prompt += `${index + 1}. ${source.title}: ${source.snippet}\n`;
    });
  }
  
  if (conversationHistory.length > 0) {
    prompt += `\nPlease synthesize this information with our conversation history to provide a contextual, comprehensive answer. Reference previous discussion when relevant. Mention that this response is based on ${duckDuckGoData.sourceCount} verified sources.\n`;
  } else {
    prompt += `\nPlease synthesize this information into a clear, comprehensive answer. Mention that this response is based on ${duckDuckGoData.sourceCount} verified sources.\n`;
  }
  
  return prompt;
}

/**
 * Check user subscription and apply usage limits
 */
async function checkUserLimits(userId: string, userProfile: any, supabase: any): Promise<{ allowed: boolean; error?: string }> {
  const now = new Date();
  const subscription = userProfile.subscription || 'free';
  
  // Define limits based on subscription plan
  const limits = {
    free: { requests: 10, period: 'day' },
    pro: { requests: 500, period: 'month' },
    team: { requests: 5000, period: 'month' }
  };

  const userLimit = limits[subscription as keyof typeof limits] || limits.free;
  
  // Check if we need to reset the counter based on period
  const lastRequest = userProfile.last_request_at ? new Date(userProfile.last_request_at) : null;
  let shouldReset = false;
  
  if (userLimit.period === 'day') {
    // Reset daily at midnight
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    shouldReset = !lastRequest || lastRequest < startOfToday;
  } else if (userLimit.period === 'month') {
    // Reset monthly on the same day of the month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    shouldReset = !lastRequest || lastRequest < startOfThisMonth;
  }
  
  let currentCount = userProfile.requests_this_month || 0;
  
  if (shouldReset) {
    currentCount = 0;
  }
  
  // Check if user has exceeded their limit
  if (currentCount >= userLimit.requests) {
    const periodText = userLimit.period === 'day' ? 'today' : 'this month';
    const upgradeText = subscription === 'free' 
      ? ' Upgrade to Pro for 500 queries per month!' 
      : subscription === 'pro' 
        ? ' Contact us for Team plan with 5000 queries per month!'
        : '';
    
    return {
      allowed: false,
      error: `You've reached your limit of ${userLimit.requests} queries ${periodText}.${upgradeText}`
    };
  }
  
  // Update the request count and timestamp
  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        requests_this_month: currentCount + 1,
        last_request_at: now.toISOString(),
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user request count:', updateError);
      // Don't fail the request for this error, just log it
    }
  } catch (error) {
    console.error('Exception updating user request count:', error);
  }
  
  const remaining = userLimit.requests - (currentCount + 1);
  console.log(`🔑 User ${userId} (${subscription}): ${currentCount + 1}/${userLimit.requests} requests used, ${remaining} remaining this ${userLimit.period}`);
  
  return { allowed: true };
}

/**
 * API route handler for search queries with conversation context and user authentication
 * Integrates DuckDuckGo search with Claude 3 Sonnet for contextual AI-powered responses
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.',
    });
  }

  const { query, conversationHistory = [] } = req.body;

  // Validate input
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid search query.',
    });
  }

  const trimmedQuery = query.trim();

  // Validate query length
  if (trimmedQuery.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'Query is too long. Please keep it under 500 characters.',
    });
  }

  // Validate conversation history
  if (conversationHistory && !Array.isArray(conversationHistory)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid conversation history format.',
    });
  }

  let user = null;
  let userProfile = null;

  try {
    // Initialize Supabase client
    const supabase = createSupabaseServerClientForAPI();

    // Get authorization header
    const authHeader = req.headers.authorization;
    let session = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          session = { user: data.user };
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    }

    if (session?.user) {
      user = session.user;
      
      // Get user profile for subscription checking
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        // Continue without profile, default to free tier
        userProfile = { subscription: 'free' };
      } else {
        userProfile = profile;
      }

      // Check user limits
      const limitCheck = await checkUserLimits(user.id, userProfile, supabase);
      if (!limitCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: limitCheck.error || 'Usage limit exceeded. Please upgrade your plan or try again later.',
          isLimitReached: true,
        });
      }
    } else {
      // Require authentication for the SaaS version
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to use WrapeR2.',
      });
    }

    console.log(`🔍 WrapeR2 Chat Search: "${trimmedQuery}" (Context: ${conversationHistory.length} messages) [User: ${user.email}]`);

    // Step 1: Fetch data from DuckDuckGo with enhanced source collection
    const duckDuckGoData = await fetchDuckDuckGoData(trimmedQuery);
    
    console.log(`📊 Search Results: ${duckDuckGoData.sourceCount} sources found (Quality: ${duckDuckGoData.searchQuality})`);

    // Step 2: Create conversation-aware context prompt
    const contextPrompt = createConversationPrompt(duckDuckGoData, trimmedQuery, conversationHistory);
    
    console.log(`🤖 Generating contextual AI response with ${duckDuckGoData.sourceCount} sources and ${conversationHistory.length} conversation messages...`);

    // Step 3: Generate response using Claude with conversation context
    const claudeResponse = await callClaude(contextPrompt);

    if (claudeResponse.error) {
      throw new Error(claudeResponse.error);
    }

    if (!claudeResponse.content) {
      throw new Error('Failed to generate AI response');
    }

    const searchQuality = duckDuckGoData.hasMinimumSources ? duckDuckGoData.searchQuality : 'poor';
    
    // Calculate remaining credits for authenticated users
    let creditsRemaining = undefined;
    let creditsWarning = undefined;
    
    if (user && userProfile) {
      const limits = {
        free: { requests: 10, period: 'day' },
        pro: { requests: 500, period: 'month' },
        team: { requests: 5000, period: 'month' }
      };
      
      const userLimit = limits[userProfile.subscription as keyof typeof limits] || limits.free;
      const currentCount = (userProfile.requests_this_month || 0) + 1; // +1 for current request
      creditsRemaining = Math.max(userLimit.requests - currentCount, 0);
      
      if (creditsRemaining <= 2 && creditsRemaining > 0) {
        creditsWarning = `Only ${creditsRemaining} credits remaining this ${userLimit.period}. Consider upgrading your plan.`;
      } else if (creditsRemaining === 0) {
        creditsWarning = `You've reached your limit. Upgrade for more credits.`;
      }
    }
    
    // Step 4: Save to history if user is authenticated
    if (user) {
      try {
        const { error: historyError } = await supabase
          .from('history')
          .insert({
            user_id: user.id,
            query: trimmedQuery,
            response: claudeResponse.content,
          });

        if (historyError) {
          console.error('History save error:', historyError);
          // Don't fail the request if history save fails
        } else {
          console.log(`💾 Saved search to user history`);
        }
      } catch (historyError) {
        console.error('History save exception:', historyError);
      }
    }
    
    console.log(`✅ WrapeR2 Contextual Search completed (Quality: ${searchQuality}, Context: ${conversationHistory.length} msgs)`);

    // Step 5: Return enhanced response
    const response: ApiResponse = {
      success: true,
      answer: claudeResponse.content,
      source: duckDuckGoData.abstractSource ? {
        name: duckDuckGoData.abstractSource,
        url: duckDuckGoData.abstractURL,
      } : undefined,
      sources: duckDuckGoData.sources,
      sourceCount: duckDuckGoData.sourceCount,
      searchQuality: searchQuality,
      hasMinimumSources: duckDuckGoData.hasMinimumSources,
      image: duckDuckGoData.image || undefined,
      creditsRemaining: creditsRemaining,
      creditsWarning: creditsWarning,
      remainingQueries: creditsRemaining,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ WrapeR2 Chat Search error:', error);

    // Determine if it's a client error or server error
    const isClientError = error instanceof Error && (
      error.message.includes('API key') ||
      error.message.includes('rate limit') ||
      error.message.includes('quota')
    );

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: isClientError 
        ? error.message 
        : 'An unexpected error occurred while processing your request. Please try again.',
    });
  }
} 