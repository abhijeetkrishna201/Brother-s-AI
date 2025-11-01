import { supabase, type DbChatHistory } from './supabase';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  attachments?: FileAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
  messages: Message[];
  sessionId: string; // Add session tracking
  startRank: number; // Track the starting rank of this session
}

export interface ChatEntry {
  chat_id: string;
  user_request: string;
  ai_response: string;
  created_at: string;
  session_id?: string;
}

// Track the current session ID in memory
let currentSessionId: string | null = null;
let currentSessionStartRank: number = 0;

/**
 * Start a new conversation session
 */
export function startNewSession(): string {
  currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return currentSessionId;
}

/**
 * Get the current session ID
 */
export function getCurrentSessionId(): string | null {
  return currentSessionId;
}

/**
 * Set the current session (when loading an existing conversation)
 */
export function setCurrentSession(sessionId: string, startRank: number): void {
  currentSessionId = sessionId;
  currentSessionStartRank = startRank;
}

/**
 * Clear the current session
 */
export function clearCurrentSession(): void {
  currentSessionId = null;
  currentSessionStartRank = 0;
}

/**
 * Fetch all conversations grouped by session
 */
export async function fetchConversations(userId: string): Promise<Conversation[]> {
  try {
    // Fetch all chat history for user, ordered by rank (oldest first)
    const { data: chatHistory, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('chat_rank', { ascending: true });

    if (error) {
      return [];
    }

    if (!chatHistory || chatHistory.length === 0) {
      return [];
    }

    // Group chat entries by continuous sessions
    // A new session starts when there's a gap in ranks > 1 or after default messages
    const conversations: Conversation[] = [];
    let currentConversation: {
      startRank: number;
      entries: typeof chatHistory;
      sessionId: string;
    } | null = null;

    for (let i = 0; i < chatHistory.length; i++) {
      const entry = chatHistory[i];
      const prevEntry = i > 0 ? chatHistory[i - 1] : null;

      // Start new conversation if:
      // 1. This is the first entry
      // 2. There's a gap in ranks (indicates a new session)
      // 3. Previous entry was from a different session
      const shouldStartNew = !currentConversation || 
                            (prevEntry && entry.chat_rank !== prevEntry.chat_rank + 1);

      if (shouldStartNew) {
        // Save previous conversation
        if (currentConversation && currentConversation.entries.length > 0) {
          conversations.push(createConversationFromEntries(currentConversation));
        }

        // Start new conversation
        currentConversation = {
          startRank: entry.chat_rank,
          entries: [entry],
          sessionId: `conv_${entry.chat_rank}`
        };
      } else {
        // Add to current conversation
        currentConversation.entries.push(entry);
      }
    }

    // Don't forget the last conversation
    if (currentConversation && currentConversation.entries.length > 0) {
      conversations.push(createConversationFromEntries(currentConversation));
    }

    // Reverse so newest conversations are first
    return conversations.reverse();
  } catch (error) {
    return [];
  }
}

/**
 * Helper function to create a Conversation from chat entries
 */
function createConversationFromEntries(data: {
  startRank: number;
  entries: any[];
  sessionId: string;
}): Conversation {
  const messages: Message[] = [];

  // Convert each chat entry to user + assistant messages
  data.entries.forEach((entry) => {
    // User message
    messages.push({
      id: `${entry.chat_id}_user`,
      content: entry.user_request,
      role: 'user',
      timestamp: formatTime(entry.created_at),
      attachments: undefined
    });

    // Assistant message
    messages.push({
      id: `${entry.chat_id}_assistant`,
      content: entry.ai_response,
      role: 'assistant',
      timestamp: formatTime(entry.created_at),
      attachments: undefined
    });
  });

  const firstEntry = data.entries[0];
  const lastEntry = data.entries[data.entries.length - 1];

  return {
    id: data.sessionId,
    title: firstEntry.user_request.substring(0, 50) + (firstEntry.user_request.length > 50 ? '...' : ''),
    timestamp: formatTimestamp(lastEntry.created_at), // Use last entry time for "most recent"
    preview: firstEntry.user_request.substring(0, 100) + (firstEntry.user_request.length > 100 ? '...' : ''),
    messages: messages,
    sessionId: data.sessionId,
    startRank: data.startRank
  };
}

/**
 * Create a new chat entry (user request + AI response)
 * Returns the chat_id
 */
export async function createChatEntry(
  userId: string,
  userRequest: string,
  aiResponse: string
): Promise<string | null> {
  try {
    console.log('💬 Creating new chat entry for user:', userId);
    console.log('📊 User request length:', userRequest.length, 'chars');
    console.log('📊 AI response length:', aiResponse.length, 'chars');

    // Get next chat rank
    console.log('🔍 Fetching current max chat_rank...');
    const { data: maxRankData, error: rankError } = await supabase
      .from('chat_history')
      .select('chat_rank')
      .eq('user_id', userId)
      .order('chat_rank', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rankError) {
      console.error('❌ Error fetching max rank:', rankError);
      return null;
    }

    const nextRank = (maxRankData?.chat_rank || 0) + 1;
    const chatId = `${userId}${nextRank}`;

    console.log(`📝 Next rank: ${nextRank}, Chat ID: ${chatId}`);

    // If no session is active, start a new one
    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      currentSessionStartRank = nextRank;
      console.log('🆕 Auto-started new session:', currentSessionId);
    } else {
      console.log('📌 Using existing session:', currentSessionId);
    }

    // Insert chat entry
    console.log('💾 Inserting chat entry into database...');
    const { data: insertedData, error: insertError } = await supabase
      .from('chat_history')
      .insert({
        chat_id: chatId,
        user_id: userId,
        user_request: userRequest,
        ai_response: aiResponse,
        chat_rank: nextRank,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.error('❌ Error inserting chat entry:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      return null;
    }

    console.log(`✅ Chat entry created successfully: ${chatId}`);
    console.log('📦 Inserted data:', insertedData);
    return chatId;
  } catch (error) {
    console.error('❌ Exception in createChatEntry:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Save current conversation session to database
 * This is called when starting a new conversation to preserve the old one
 */
export async function saveCurrentSession(
  userId: string,
  messages: Message[]
): Promise<boolean> {
  try {
    if (messages.length === 0) {
      console.log('⚠️ No messages to save');
      return true;
    }

    // Filter out default messages (the "Who are you?" conversation)
    const nonDefaultMessages = messages.filter(m => 
      !(m.content === 'Who are you?' || m.content.includes('I am Brother\'s AI'))
    );

    if (nonDefaultMessages.length === 0) {
      console.log('⚠️ Only default messages, skipping save');
      return true;
    }

    console.log(`💾 Saving ${nonDefaultMessages.length} messages from current session`);

    // Get next available rank
    const { data: maxRankData } = await supabase
      .from('chat_history')
      .select('chat_rank')
      .eq('user_id', userId)
      .order('chat_rank', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextRank = (maxRankData?.chat_rank || 0) + 1;

    // Process pairs of messages (user + assistant)
    for (let i = 0; i < nonDefaultMessages.length; i += 2) {
      const userMsg = nonDefaultMessages[i];
      const assistantMsg = nonDefaultMessages[i + 1];

      if (userMsg && assistantMsg && userMsg.role === 'user' && assistantMsg.role === 'assistant') {
        const chatId = `${userId}${nextRank}`;
        
        const { error } = await supabase
          .from('chat_history')
          .insert({
            chat_id: chatId,
            user_id: userId,
            user_request: userMsg.content,
            ai_response: assistantMsg.content,
            chat_rank: nextRank,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error saving message pair:', error);
          return false;
        }

        nextRank++;
      }
    }

    console.log('✅ Session saved successfully');
    return true;
  } catch (error) {
    console.error('Error in saveCurrentSession:', error);
    return false;
  }
}

/**
 * Delete a conversation and all its chat entries
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting conversation:', conversationId);

    // Extract the rank from conversation ID (format: conv_123)
    const rankStr = conversationId.replace('conv_', '').replace('session_', '');
    const startRank = parseInt(rankStr, 10);

    if (isNaN(startRank)) {
      console.error('Invalid conversation ID format:', conversationId);
      return false;
    }

    // Get all entries for this conversation to find the range
    const { data: entries, error: fetchError } = await supabase
      .from('chat_history')
      .select('chat_rank')
      .gte('chat_rank', startRank)
      .order('chat_rank', { ascending: true });

    if (fetchError) {
      console.error('Error fetching conversation entries:', fetchError);
      return false;
    }

    if (!entries || entries.length === 0) {
      console.log('⚠️ No entries found for conversation');
      return false;
    }

    // Find continuous range from startRank
    let endRank = startRank;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].chat_rank === endRank) {
        // Check if next entry is continuous
        if (i + 1 < entries.length && entries[i + 1].chat_rank === endRank + 1) {
          endRank++;
        } else {
          break; // End of this conversation
        }
      }
    }

    // Delete all chat entries in this range
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .gte('chat_rank', startRank)
      .lte('chat_rank', endRank);

    if (error) {
      console.error('Error deleting chat entries:', error);
      return false;
    }

    console.log(`✅ Deleted conversation ${conversationId} (ranks ${startRank}-${endRank})`);
    return true;
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    return false;
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  try {
    // Extract the rank from conversation ID
    const rankStr = conversationId.replace('conv_', '').replace('session_', '');
    const startRank = parseInt(rankStr, 10);

    if (isNaN(startRank)) {
      console.error('Invalid conversation ID format:', conversationId);
      return [];
    }

    // Get all entries starting from this rank
    const { data: entries, error: fetchError } = await supabase
      .from('chat_history')
      .select('*')
      .gte('chat_rank', startRank)
      .order('chat_rank', { ascending: true });

    if (fetchError) {
      console.error('Error fetching conversation messages:', fetchError);
      return [];
    }

    if (!entries || entries.length === 0) {
      return [];
    }

    // Find continuous entries for this conversation
    const conversationEntries = [];
    let expectedRank = startRank;
    
    for (const entry of entries) {
      if (entry.chat_rank === expectedRank) {
        conversationEntries.push(entry);
        expectedRank++;
      } else {
        break; // Gap found, end of this conversation
      }
    }

    // Convert to messages
    const messages: Message[] = [];
    conversationEntries.forEach(entry => {
      messages.push({
        id: `${entry.chat_id}_user`,
        content: entry.user_request,
        role: 'user',
        timestamp: formatTime(entry.created_at),
        attachments: undefined
      });
      messages.push({
        id: `${entry.chat_id}_assistant`,
        content: entry.ai_response,
        role: 'assistant',
        timestamp: formatTime(entry.created_at),
        attachments: undefined
      });
    });

    return messages;
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    return [];
  }
}

/**
 * Feedback Management
 */

export interface FeedbackData {
  feedback: string;
  name?: string;
  contact?: string;
  feedbackType?: 'general' | 'bug' | 'suggestion' | 'praise';
}

export interface FeedbackEntry {
  feedback_id: string;
  user_id: string | null;
  feedback_text: string;
  user_name: string | null;
  contact_info: string | null;
  feedback_type: string;
  status: string;
  created_at: string;
}

/**
 * Submit feedback to database
 */
export async function submitFeedback(
  feedbackData: FeedbackData,
  userId?: string | null
): Promise<string | null> {
  try {
    console.log('📝 Submitting feedback to database...');

    // Generate feedback ID
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase
      .from('feedback')
      .insert({
        feedback_id: feedbackId,
        user_id: userId || null,
        feedback_text: feedbackData.feedback,
        user_name: feedbackData.name || null,
        contact_info: feedbackData.contact || null,
        feedback_type: feedbackData.feedbackType || 'general',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error submitting feedback:', error);
      return null;
    }

    console.log(`✅ Feedback submitted: ${feedbackId}`);
    return feedbackId;
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    return null;
  }
}

/**
 * Get all feedback (for admin)
 */
export async function getAllFeedback(
  limit: number = 100,
  offset: number = 0
): Promise<FeedbackEntry[]> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllFeedback:', error);
    return [];
  }
}

/**
 * Update feedback status (for admin)
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'new' | 'reviewed' | 'resolved'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('feedback')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('feedback_id', feedbackId);

    if (error) {
      console.error('Error updating feedback status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateFeedbackStatus:', error);
    return false;
  }
}

/**
 * Get feedback count by status
 */
export async function getFeedbackStats(): Promise<{
  total: number;
  new: number;
  reviewed: number;
  resolved: number;
}> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('status');

    if (error) {
      console.error('Error fetching feedback stats:', error);
      return { total: 0, new: 0, reviewed: 0, resolved: 0 };
    }

    const stats = {
      total: data?.length || 0,
      new: data?.filter(f => f.status === 'new').length || 0,
      reviewed: data?.filter(f => f.status === 'reviewed').length || 0,
      resolved: data?.filter(f => f.status === 'resolved').length || 0
    };

    return stats;
  } catch (error) {
    console.error('Error in getFeedbackStats:', error);
    return { total: 0, new: 0, reviewed: 0, resolved: 0 };
  }
}

/**
 * Migrate localStorage data to new schema (not applicable)
 */
export async function migrateLocalStorageToSupabase(userId: string): Promise<boolean> {
  console.log('⚠️ Migration not implemented for new schema');
  // Clear old localStorage data
  localStorage.removeItem('brothers_ai_conversations');
  return true;
}

/**
 * Format timestamp for display (e.g., "2 hours ago")
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format time for message timestamps (e.g., "2:30 PM")
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
