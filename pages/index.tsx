import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SearchInput from '../components/SearchInput';
import ChatMessage from '../components/ChatMessage';
import LoadingIndicator from '../components/LoadingIndicator';
import { createSupabaseBrowserClient } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface SearchResponse {
  success: boolean;
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
  hasMinimumSources?: boolean;
  image?: string;
  error?: string;
  remainingQueries?: number;
  isLimitReached?: boolean;
}

interface ChatHistory {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchData?: SearchResponse;
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

interface UserProfile {
  id: string;
  email: string;
  subscription: 'free' | 'pro' | 'team';
  requests_this_month: number;
  created_at: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          } else {
            setProfile(profileData);
          }
        } else {
          // Redirect to login if not authenticated
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        router.push('/login');
      } else if (session?.user) {
        setUser(session.user);
        
        // Fetch updated profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  // Load saved chat history from localStorage
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`wraper2-chat-history-${user.id}`);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setChatHistory(parsedHistory);
        } catch (e) {
          console.error('Error loading chat history:', e);
        }
      }
    }
  }, [user]);

  // Save chat history to localStorage
  useEffect(() => {
    if (user && chatHistory.length > 0) {
      localStorage.setItem(`wraper2-chat-history-${user.id}`, JSON.stringify(chatHistory));
    }
  }, [chatHistory, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || !user) return;

    // Check usage limits for free users
    if (profile?.subscription === 'free' && profile?.requests_this_month >= 10) {
      setError('You\'ve reached your monthly limit of 10 queries. Upgrade to Pro for unlimited access!');
      return;
    }

    const userMessageId = Date.now().toString();
    const userMessage: ChatHistory = {
      id: userMessageId,
      type: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    // Add user message to chat
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError('');

    try {
      // Prepare conversation context for API
      const conversationHistory = chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        searchQuality: msg.searchQuality,
        sourceCount: msg.sourceCount
      }));

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ 
          query: query.trim(),
          conversationHistory 
        }),
      });

      const data: SearchResponse = await response.json();

      if (data.success) {
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: ChatHistory = {
          id: assistantMessageId,
          type: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          searchData: data,
          sources: data.sources,
          sourceCount: data.sourceCount,
          searchQuality: data.searchQuality,
          image: data.image,
        };

        setChatHistory(prev => [...prev, assistantMessage]);

        // Update profile with new usage count
        if (profile) {
          setProfile(prev => prev ? {
            ...prev,
            requests_this_month: prev.requests_this_month + 1
          } : null);
        }
      } else {
        if (data.isLimitReached) {
          setError('You\'ve reached your monthly limit. Upgrade to Pro for unlimited access!');
        } else {
          setError(data.error || 'An error occurred while processing your request.');
        }
        // Remove the user message if there was an error
        setChatHistory(prev => prev.filter(msg => msg.id !== userMessageId));
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to connect to the search service. Please try again.');
      // Remove the user message if there was an error
      setChatHistory(prev => prev.filter(msg => msg.id !== userMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setError('');
    if (user) {
      localStorage.removeItem(`wraper2-chat-history-${user.id}`);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user || !profile) {
    return null;
  }

  const remainingQueries = profile.subscription === 'free' ? Math.max(0, 10 - profile.requests_this_month) : null;
  const isLimitReached = profile.subscription === 'free' && profile.requests_this_month >= 10;

  return (
    <>
      <Head>
        <title>WrapeR2 | AI Search Assistant</title>
        <meta name="description" content="WrapeR2 - Get AI-powered answers with multiple verified sources using DuckDuckGo data and Claude AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="AI search, Claude AI, DuckDuckGo, search assistant, WrapeR2" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-white flex flex-col">
        {/* Header with Auth */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  WrapeR2
                </h1>
                <span className="text-sm text-gray-500 hidden sm:block">
                  AI Search Assistant
                </span>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                {/* Usage Counter for Free Users */}
                {profile.subscription === 'free' && (
                  <div className="text-sm text-gray-600">
                    <span className={`font-medium ${isLimitReached ? 'text-red-600' : remainingQueries && remainingQueries <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                      {remainingQueries} queries left
                    </span>
                    {isLimitReached && (
                      <Link href="/pricing" className="ml-2 text-blue-600 hover:text-blue-700 font-medium">
                        Upgrade
                      </Link>
                    )}
                  </div>
                )}

                {/* Subscription Badge */}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  profile.subscription === 'pro' ? 'bg-blue-100 text-blue-800' :
                  profile.subscription === 'team' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.subscription.toUpperCase()}
                </span>

                {/* Navigation */}
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Dashboard
                </Link>
                
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Pricing
                </Link>

                {/* Clear Chat Button */}
                {chatHistory.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Limit Warning */}
        {profile.subscription === 'free' && remainingQueries !== null && remainingQueries <= 3 && !isLimitReached && (
          <div className="bg-orange-50 border-b border-orange-200">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-orange-800 text-sm">
                    You have {remainingQueries} queries remaining this month.
                  </span>
                </div>
                <Link href="/pricing" className="text-orange-800 hover:text-orange-900 text-sm font-medium underline">
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Limit Reached Banner */}
        {isLimitReached && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span className="text-red-800 text-sm font-medium">
                    You've reached your monthly limit of 10 queries.
                  </span>
                </div>
                <Link href="/pricing" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Upgrade Now
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {/* Welcome Message */}
            {chatHistory.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">🔍</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome back, {user.email?.split('@')[0]}!
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Get comprehensive answers backed by multiple verified sources. 
                  Powered by Claude AI and real-time web data.
                </p>
                
                {/* Features */}
                <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                  <div className="text-center">
                    <div className="text-2xl mb-3">📚</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Multiple Sources</h3>
                    <p className="text-sm text-gray-600">Every answer is backed by verified sources from across the web</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl mb-3">🧠</div>
                    <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
                    <p className="text-sm text-gray-600">Advanced Claude AI for intelligent, nuanced responses</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl mb-3">💬</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Conversational</h3>
                    <p className="text-sm text-gray-600">Follow-up questions that build on previous context</p>
                  </div>
                </div>

                {/* Usage Status */}
                {profile.subscription === 'free' && (
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                    <p className="text-blue-800 text-sm">
                      <strong>Free Plan:</strong> {remainingQueries} of 10 queries remaining this month
                    </p>
                    <Link href="/pricing" className="text-blue-600 hover:text-blue-700 text-sm font-medium underline">
                      Upgrade for unlimited access
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Chat Messages */}
            <div className="space-y-6">
              {chatHistory.map((message, index) => (
                <div key={message.id}>
                  <ChatMessage 
                    message={message}
                    isLatest={index === chatHistory.length - 1}
                  />
                </div>
              ))}
            </div>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="mt-6">
                <LoadingIndicator />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
                {error.includes('limit') && (
                  <div className="mt-3">
                    <Link href="/pricing" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Upgrade to Pro
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Search Input - Fixed at bottom */}
          <div className="border-t border-gray-200 bg-white p-4">
            <SearchInput 
              onSearch={handleSearch} 
              isLoading={isLoading}
              disabled={isLimitReached}
              placeholder={isLimitReached ? "Upgrade to Pro to continue searching..." : "Ask me anything..."}
            />
          </div>
        </div>
      </main>
    </>
  );
} 