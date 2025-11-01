import { useState, useEffect } from 'react';
import { AuthPage } from './components/auth-page';
import { ChatSidebar } from './components/chat-sidebar';
import { ChatArea } from './components/chat-area';
import { ChatInput } from './components/chat-input';
import { ChatHeader } from './components/chat-header';
import { ApiSetup } from './components/api-setup';
import { AdminLogin } from './components/admin-login';
import { AdminSettings, type AdminConfig } from './components/admin-settings';
import { ContactDeveloper } from './components/contact-developer';
import { DatabaseStatus } from './components/database-status';
import { WelcomeDialog } from './components/welcome-dialog';
import { Sheet, SheetContent } from './components/ui/sheet';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { geminiService, updateGeminiApiKey, type ChatMessage } from './lib/gemini';
import { getUserSessionId, initializeUser } from './lib/supabase';
import * as dbService from './lib/database-service';
import userAvatar from 'figma:asset/9468a2a945fdccaafef131dee9c968de9c1f9fbd.png';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  attachments?: FileAttachment[];
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
  messages: Message[];
}

const DEFAULT_INTRO_MESSAGE = `I am Brother's AI, created by Mr. Abhijeet Krishna Budhak. He is a 3rd-year B.Tech Computer Science and Engineering student studying at Ballarpur Institute of Technology. This chatbot is powered by Gemini AI, Google's advanced language model.

I'm here to assist you with various tasks including answering questions, helping with coding problems, providing explanations on technical topics, and engaging in meaningful conversations. Feel free to ask me anything you'd like to know!`;

const DEFAULT_USER_AVATAR = userAvatar;

const getDefaultMessages = (introMessage: string): Message[] => [
  {
    id: '1',
    content: 'Who are you?',
    role: 'user',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: '2',
    content: introMessage,
    role: 'assistant',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('You');
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [userLastName, setUserLastName] = useState<string>('');
  const [userMobileNo, setUserMobileNo] = useState<string>('');
  const [isGuest, setIsGuest] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Database state
  const [userId, setUserId] = useState<string>('');
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Admin state
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Contact Developer state
  const [isContactDeveloperOpen, setIsContactDeveloperOpen] = useState(false);
  
  // Welcome Dialog state
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  
  // Admin config state
  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    apiKey: '',
    username: '',
    userProfilePicture: DEFAULT_USER_AVATAR,
    defaultMessage: DEFAULT_INTRO_MESSAGE,
    emailJsServiceId: '',
    emailJsTemplateId: '',
    emailJsPublicKey: '',
    supabaseUrl: '',
    supabaseAnonKey: ''
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authData = localStorage.getItem('brothers_ai_auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          // Check if auth is still valid (30 days)
          const daysSinceAuth = (Date.now() - parsed.authenticatedAt) / (1000 * 60 * 60 * 24);
          if (daysSinceAuth < 30) {
            setUserId(parsed.userId);
            setUserEmail(parsed.email);
            const displayName = parsed.firstName || parsed.name || 'User';
            setUserName(displayName);
            setUserFirstName(parsed.firstName || '');
            setUserLastName(parsed.lastName || '');
            setUserMobileNo(parsed.mobileNo || '');
            setIsGuest(parsed.isGuest || false);
            setIsAuthenticated(true);
            setAdminConfig(prev => ({ ...prev, username: displayName }));
            
            // Load full user data from database
            if (!parsed.isGuest) {
              const { supabase } = await import('./lib/supabase');
              const { data: userData } = await supabase
                .from('users')
                .select('first_name, last_name, mobile_no')
                .eq('user_id', parsed.userId)
                .maybeSingle();
              
              if (userData) {
                setUserFirstName(userData.first_name || '');
                setUserLastName(userData.last_name || '');
                setUserMobileNo(userData.mobile_no || '');
              }
            }
          } else {
            // Auth expired
            localStorage.removeItem('brothers_ai_auth');
          }
        }
      } catch (error) {
        // Silent error handling
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Initialize database and load data on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    async function initializeApp() {
      setIsLoadingData(true);
      
      try {
        // Load admin config from DATABASE first (priority)
        const { fetchAdminConfig } = await import('./lib/supabase');
        const dbConfig = await fetchAdminConfig();
        
        if (dbConfig) {
          // Use database config
          setAdminConfig({
            apiKey: dbConfig.gemini_api_key || '',
            username: userName || 'User',
            userProfilePicture: dbConfig.user_profile_picture || DEFAULT_USER_AVATAR,
            defaultMessage: dbConfig.default_message || DEFAULT_INTRO_MESSAGE,
            emailJsServiceId: dbConfig.emailjs_service_id || '',
            emailJsTemplateId: dbConfig.emailjs_template_id || '',
            emailJsPublicKey: dbConfig.emailjs_public_key || '',
            supabaseUrl: dbConfig.supabase_url || '',
            supabaseAnonKey: dbConfig.supabase_anon_key || ''
          });
          
          // Update Supabase configuration if saved in database
          if (dbConfig.supabase_url && dbConfig.supabase_anon_key) {
            const { updateSupabaseConfig } = await import('./lib/supabase');
            updateSupabaseConfig(dbConfig.supabase_url, dbConfig.supabase_anon_key);
          }
          
          // Update API key if saved in database
          if (dbConfig.gemini_api_key) {
            updateGeminiApiKey(dbConfig.gemini_api_key);
            setIsApiConfigured(true);
          }
          
          toast.success('Admin settings loaded from database');
        } else {
          // Fallback: Load admin config from localStorage (backward compatibility)
          const savedConfig = localStorage.getItem('brothers_ai_admin_config');
          if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            setAdminConfig(parsed);
            
            // Update API key if saved
            if (parsed.apiKey) {
              updateGeminiApiKey(parsed.apiKey);
              setIsApiConfigured(true);
            }
          } else {
            // Check for old API key in localStorage (for backward compatibility)
            const oldApiKey = localStorage.getItem('gemini_api_key');
            if (oldApiKey) {
              updateGeminiApiKey(oldApiKey);
              setIsApiConfigured(true);
              setAdminConfig(prev => ({ ...prev, apiKey: oldApiKey }));
            }
          }
        }

        // Check admin session
        const adminSession = sessionStorage.getItem('admin_session');
        const sessionTime = sessionStorage.getItem('admin_session_time');
        if (adminSession === 'authenticated' && sessionTime) {
          const timeElapsed = Date.now() - parseInt(sessionTime);
          if (timeElapsed < 24 * 60 * 60 * 1000) {
            setIsAdminAuthenticated(true);
          } else {
            sessionStorage.removeItem('admin_session');
            sessionStorage.removeItem('admin_session_time');
          }
        }

        // Initialize user in database with auth data
        const config = savedConfig ? JSON.parse(savedConfig) : null;
        // Use userName from auth, fallback to config or defaults
        const displayName = userName || config?.username || (isGuest ? 'Guest User' : 'User');
        
        // Get first/last name from auth data if available
        const authData = localStorage.getItem('brothers_ai_auth');
        let firstName = displayName;
        let lastName = '';
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            firstName = parsed.firstName || displayName;
            lastName = parsed.lastName || '';
          } catch (e) {
            // Ignore
          }
        }
        
        await initializeUser(
          userId,
          firstName,
          config?.userProfilePicture || DEFAULT_USER_AVATAR,
          userEmail || userId,
          lastName
        );
        
        // Update admin config with the display name
        setAdminConfig(prev => ({ ...prev, username: displayName }));

        // Check for localStorage data to migrate
        const localConversations = localStorage.getItem('brothers_ai_conversations');
        if (localConversations) {
          toast.info('Migrating your conversations to cloud storage...');
          const migrated = await dbService.migrateLocalStorageToSupabase(userId);
          if (migrated) {
            toast.success('Conversations migrated successfully!');
          }
        }

        // Load conversations from Supabase
        const dbConversations = await dbService.fetchConversations(userId);
        setConversations(dbConversations);
        setIsDatabaseReady(true);

        // Try to restore last active conversation
        const savedActiveConv = localStorage.getItem(`brothers_ai_active_conversation_${userId}`);
        if (savedActiveConv && dbConversations.length > 0) {
          const lastConversation = dbConversations.find(c => c.id === savedActiveConv);
          if (lastConversation && lastConversation.messages.length > 0) {
            setActiveConversation(lastConversation.id);
            setMessages(lastConversation.messages);
            // Set the session for this conversation
            dbService.setCurrentSession(lastConversation.sessionId, lastConversation.startRank);
            toast.success(`Restored: ${lastConversation.title}`);
          } else {
            // Conversation not found or empty, use most recent conversation
            const mostRecentConv = dbConversations[0];
            if (mostRecentConv && mostRecentConv.messages.length > 0) {
              setActiveConversation(mostRecentConv.id);
              setMessages(mostRecentConv.messages);
              dbService.setCurrentSession(mostRecentConv.sessionId, mostRecentConv.startRank);
            } else {
              // No conversations with messages, show default and start new session
              dbService.startNewSession();
              setMessages(getDefaultMessages(config?.defaultMessage || DEFAULT_INTRO_MESSAGE));
            }
          }
        } else if (dbConversations.length > 0) {
          // No saved active conversation, but we have conversations
          const mostRecentConv = dbConversations[0];
          if (mostRecentConv && mostRecentConv.messages.length > 0) {
            setActiveConversation(mostRecentConv.id);
            setMessages(mostRecentConv.messages);
            dbService.setCurrentSession(mostRecentConv.sessionId, mostRecentConv.startRank);
          } else {
            // No conversations with messages, show default and start new session
            dbService.startNewSession();
            setMessages(getDefaultMessages(config?.defaultMessage || DEFAULT_INTRO_MESSAGE));
          }
        } else {
          // No conversations at all, show default messages and start new session
          dbService.startNewSession();
          setMessages(getDefaultMessages(config?.defaultMessage || DEFAULT_INTRO_MESSAGE));
        }

      } catch (error) {
        toast.error('Failed to connect to database. Using local storage mode.');
        
        // Fallback to localStorage
        try {
          const savedConversations = localStorage.getItem('brothers_ai_conversations');
          if (savedConversations) {
            const parsed = JSON.parse(savedConversations);
            setConversations(parsed);
          }
        } catch (e) {
          // Silent error handling
        }
      } finally {
        setIsLoadingData(false);
      }
    }

    initializeApp();
  }, [isAuthenticated, userId, isGuest]);

  // Update messages when admin config changes (for default message)
  useEffect(() => {
    if (!activeConversation && messages.length === 2 && messages[0].content === 'Who are you?') {
      setMessages(getDefaultMessages(adminConfig.defaultMessage));
    }
  }, [adminConfig.defaultMessage]);

  // Save admin config to DATABASE and localStorage
  useEffect(() => {
    async function saveAdminConfig() {
      try {
        // Save to localStorage (backward compatibility)
        localStorage.setItem('brothers_ai_admin_config', JSON.stringify(adminConfig));
        
        // Save to DATABASE (primary storage)
        if (isAdminAuthenticated) {
          const { updateAdminConfig: updateDbConfig, updateSupabaseConfig } = await import('./lib/supabase');
          const saved = await updateDbConfig({
            gemini_api_key: adminConfig.apiKey,
            user_profile_picture: adminConfig.userProfilePicture,
            default_message: adminConfig.defaultMessage,
            emailjs_service_id: adminConfig.emailJsServiceId,
            emailjs_template_id: adminConfig.emailJsTemplateId,
            emailjs_public_key: adminConfig.emailJsPublicKey,
            supabase_url: adminConfig.supabaseUrl,
            supabase_anon_key: adminConfig.supabaseAnonKey
          });
          
          if (!saved) {
            toast.error('Failed to save admin settings to database');
          }
          
          // Update Supabase configuration if changed
          if (adminConfig.supabaseUrl && adminConfig.supabaseAnonKey) {
            updateSupabaseConfig(adminConfig.supabaseUrl, adminConfig.supabaseAnonKey);
          }
        }
        
        // Update API key if changed
        if (adminConfig.apiKey) {
          updateGeminiApiKey(adminConfig.apiKey);
          setIsApiConfigured(true);
        }

        // Update user in database if ready
        if (userId && isDatabaseReady) {
          const authData = localStorage.getItem('brothers_ai_auth');
          let lastName = '';
          if (authData) {
            try {
              const parsed = JSON.parse(authData);
              lastName = parsed.lastName || '';
            } catch (e) {
              // Ignore
            }
          }
          initializeUser(userId, adminConfig.username, adminConfig.userProfilePicture, userEmail || userId, lastName);
        }
      } catch (error) {
        // Silent error handling
      }
    }

    saveAdminConfig();
  }, [adminConfig, userId, isDatabaseReady, isAdminAuthenticated]);

  const handleSendMessage = async (content: string, attachments?: FileAttachment[]) => {
    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Convert current messages to the format expected by Gemini service
      const conversationHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments
      }));

      // Create a timeout promise (60 seconds for better reliability)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 60 seconds')), 60000);
      });

      // Race between API call and timeout
      const aiResponse = await Promise.race([
        geminiService.generateResponse(
          content,
          attachments || [],
          conversationHistory
        ),
        timeoutPromise
      ]);

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Save complete chat entry (user request + AI response) to database
      if (userId && !isGuest) {
        try {
          const chatId = await dbService.createChatEntry(userId, content, aiResponse);
          if (chatId) {
            // Reload conversations every 5th message to keep sidebar updated
            const messageCount = finalMessages.length;
            if (messageCount % 10 === 0) {
              const updatedConversations = await dbService.fetchConversations(userId);
              setConversations(updatedConversations);
            }
          } else {
            toast.error('Failed to save message to database');
          }
        } catch (saveError) {
          toast.error('Failed to save message to database');
        }
      }
    } catch (error) {
      // Error handling for AI response
      
      let errorContent = 'Sorry, I encountered an error while processing your request. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          errorContent = '⏱️ The request timed out. The AI service might be slow right now. Please try again in a moment.';
        } else if (error.message.includes('overloaded') || error.message.includes('503')) {
          errorContent = '🔄 The AI service is currently overloaded. Please wait a few moments and try again. This is a temporary issue with Google\'s servers.';
        } else if (error.message.includes('API key')) {
          errorContent = '🔑 There seems to be an issue with the API configuration. Please check your API key in Admin Settings.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorContent = '❌ The AI service is currently unavailable. Please try again later.';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorContent = '📊 API usage limit reached. Please try again later or check your quota in Google AI Studio.';
        } else if (error.message.includes('429')) {
          errorContent = '⚠️ Too many requests. Please wait a moment before trying again.';
        }
      }
      
      const errorMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: errorContent,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);

      // Save error as chat entry too
      if (userId && !isGuest) {
        await dbService.createChatEntry(userId, content, errorContent);
        // Don't reload conversations on error to avoid UI disruption
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateConversationTitle = (firstMessage: string): string => {
    // Generate a title from the first user message, max 50 characters
    const title = firstMessage.length > 50 ? firstMessage.substring(0, 47) + '...' : firstMessage;
    return title;
  };

  const handleSelectConversation = async (id: string) => {
    // Don't save current conversation - messages are already saved in real-time
    
    setActiveConversation(id);
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setMessages(conversation.messages);
      
      // Set the session for this conversation
      dbService.setCurrentSession(conversation.sessionId, conversation.startRank);
      
      // Save active conversation to localStorage for persistence on refresh
      localStorage.setItem(`brothers_ai_active_conversation_${userId}`, id);
    }
    // Close mobile sidebar when selecting a conversation
    setIsMobileSidebarOpen(false);
  };

  const handleNewConversation = async () => {
    // Don't save current conversation - messages are already saved in real-time
    // Just reload conversations to update the sidebar
    if (userId && !isGuest) {
      const updatedConversations = await dbService.fetchConversations(userId);
      setConversations(updatedConversations);
    }
    
    // Start new session
    dbService.startNewSession();
    
    // Start new conversation with default messages (using current admin config)
    setActiveConversation(null);
    setMessages(getDefaultMessages(adminConfig.defaultMessage));
    
    // Clear saved active conversation
    localStorage.removeItem(`brothers_ai_active_conversation_${userId}`);
    
    // Close mobile sidebar when starting a new conversation
    setIsMobileSidebarOpen(false);
  };

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      // If already authenticated, open settings directly
      setIsAdminSettingsOpen(true);
    } else {
      // Otherwise, show login
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminSettingsOpen(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_session');
    sessionStorage.removeItem('admin_session_time');
  };

  const handleConfigUpdate = (newConfig: AdminConfig) => {
    setAdminConfig(newConfig);
    // Also update the userName state to reflect in the profile
    if (newConfig.username && newConfig.username !== userName) {
      setUserName(newConfig.username);
      // Update localStorage auth data
      const authData = localStorage.getItem('brothers_ai_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        parsed.name = newConfig.username;
        localStorage.setItem('brothers_ai_auth', JSON.stringify(parsed));
      }
    }
  };

  const handleDeleteConversation = async (id: string) => {
    // Delete from database
    const deleted = await dbService.deleteConversation(id);
    
    if (deleted) {
      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (activeConversation === id) {
        handleNewConversation();
      }
      toast.success('Conversation deleted');
    } else {
      toast.error('Failed to delete conversation');
    }
  };

  const handleContactDeveloperClick = () => {
    setIsContactDeveloperOpen(true);
  };

  const handleLikeMessage = async (messageId: string) => {
    // Find the message that was liked
    const likedMessage = messages.find(m => m.id === messageId);
    if (!likedMessage || likedMessage.role !== 'assistant') return;
    
    // Add a thank you message from the AI
    const thankYouMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: "Thank you so much for your positive feedback! 😊 I'm glad I could help you. Your appreciation motivates me to continue providing helpful and accurate responses. If you have any more questions or need assistance with anything else, please don't hesitate to ask!",
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, thankYouMessage];
    setMessages(updatedMessages);

    // Note: In new schema, feedback doesn't create new chat entries
    // Just update local state
    toast.success('Thank you for your feedback!');
  };

  const handleDislikeMessage = async (messageId: string) => {
    // Add a knowledge limitation message from the AI
    const limitationMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: "I appreciate your feedback. As an AI language model, I should mention that my knowledge has a cutoff date of early 2024, and I may not have access to the most recent information or developments. If my response wasn't helpful or accurate, please feel free to ask for clarification or provide more context about what you're looking for. I'm here to assist you better! ���",
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, limitationMessage];
    setMessages(updatedMessages);

    // Note: In new schema, feedback doesn't create new chat entries
    // Just update local state
    toast.info('Thank you for your feedback!');
  };

  const handleAuthSuccess = (authUserId: string, email: string, name: string, isNewUser: boolean = false) => {
    // Get existing auth data to preserve firstName/lastName if available
    const existingAuth = localStorage.getItem('brothers_ai_auth');
    let firstName = name;
    let lastName = '';
    
    if (existingAuth) {
      try {
        const parsed = JSON.parse(existingAuth);
        firstName = parsed.firstName || name;
        lastName = parsed.lastName || '';
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Save to localStorage (safety redundancy - auth-page also does this)
    try {
      localStorage.setItem('brothers_ai_auth', JSON.stringify({
        userId: authUserId,
        email: email,
        name: name,
        firstName: firstName,
        lastName: lastName,
        isGuest: false,
        authenticatedAt: Date.now()
      }));
    } catch (error) {
      // Silent error handling
    }
    
    // Update all state FIRST
    setUserId(authUserId);
    setUserEmail(email);
    setUserName(name);
    setIsGuest(false);
    setAdminConfig(prev => ({ ...prev, username: name }));
    
    // Check if user has seen welcome dialog before (use authUserId directly, not state)
    const hasSeenWelcome = localStorage.getItem(`brothers_ai_welcome_shown_${authUserId}`);
    
    // Show welcome dialog for new users who haven't seen it
    if (isNewUser && !hasSeenWelcome) {
      setShowWelcomeDialog(true);
    }
    
    // Set authenticated LAST to ensure all state is updated before re-render
    setIsAuthenticated(true);
  };

  const handleSkipLogin = () => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUserId(guestId);
    setUserName('Guest');
    setIsGuest(true);
    setIsAuthenticated(true);
    // Store guest auth
    localStorage.setItem('brothers_ai_auth', JSON.stringify({
      userId: guestId,
      email: null,
      name: 'Guest',
      isGuest: true,
      authenticatedAt: Date.now()
    }));
  };

  const handleStartConversation = () => {
    // Mark that user has seen the welcome dialog
    // Use userId from state (should be set by now) or fallback to auth data
    const currentUserId = userId || JSON.parse(localStorage.getItem('brothers_ai_auth') || '{}').userId;
    if (currentUserId) {
      localStorage.setItem(`brothers_ai_welcome_shown_${currentUserId}`, 'true');
    }
    setShowWelcomeDialog(false);
  };

  const handleProfileUpdate = async (firstName: string, lastName: string, mobileNo: string) => {
    try {
      // Update database
      const { supabase } = await import('./lib/supabase');
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          mobile_no: mobileNo,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Update local state
      setUserFirstName(firstName);
      setUserLastName(lastName);
      setUserMobileNo(mobileNo);
      setUserName(firstName); // Update display name

      // Update localStorage
      const authData = localStorage.getItem('brothers_ai_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        parsed.firstName = firstName;
        parsed.lastName = lastName;
        parsed.mobileNo = mobileNo;
        parsed.name = firstName;
        localStorage.setItem('brothers_ai_auth', JSON.stringify(parsed));
      }

      // Update admin config
      setAdminConfig(prev => ({ ...prev, username: firstName }));
    } catch (error) {
      // Re-throw error for caller to handle
      throw error;
    }
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('brothers_ai_auth');
    localStorage.removeItem('brothers_ai_user_session');
    localStorage.removeItem(`brothers_ai_active_conversation_${userId}`);
    
    // Reset state
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserName('You');
    setUserFirstName('');
    setUserLastName('');
    setUserMobileNo('');
    setUserId('');
    setIsGuest(false);
    setConversations([]);
    setMessages([]);
    setActiveConversation(null);
    
    toast.info('Signed out successfully');
  };

  // Show auth page if not authenticated
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster />
        <AuthPage onAuthSuccess={handleAuthSuccess} onSkipLogin={handleSkipLogin} />
      </>
    );
  }

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden relative">
      {/* Database Status Indicator */}
      <DatabaseStatus isDatabaseReady={isDatabaseReady} />

      {/* Admin Login Dialog */}
      <AdminLogin
        open={isAdminLoginOpen}
        onOpenChange={setIsAdminLoginOpen}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Admin Settings Dialog */}
      <AdminSettings
        open={isAdminSettingsOpen}
        onOpenChange={setIsAdminSettingsOpen}
        config={adminConfig}
        onConfigUpdate={handleConfigUpdate}
        onLogout={handleAdminLogout}
      />

      {/* Contact Developer Dialog */}
      <ContactDeveloper
        open={isContactDeveloperOpen}
        onOpenChange={setIsContactDeveloperOpen}
        userId={userId}
      />

      {/* Welcome Dialog for New Users */}
      <WelcomeDialog
        open={showWelcomeDialog}
        onStartConversation={handleStartConversation}
        username={userName}
      />

      {/* Toast Notifications */}
      <Toaster />
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-full flex-shrink-0 relative z-10">
        <ChatSidebar
          activeConversation={activeConversation}
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0 border-r border-border">
          <ChatSidebar
            activeConversation={activeConversation}
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative z-10">
        <div className="flex-shrink-0">
          <ChatHeader 
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            isMobileSidebarOpen={isMobileSidebarOpen}
            onAdminClick={handleAdminClick}
            onContactClick={handleContactDeveloperClick}
            userEmail={userEmail}
            isGuest={isGuest}
            username={userName}
            firstName={userFirstName}
            lastName={userLastName}
            mobileNo={userMobileNo}
            profilePicture={adminConfig.userProfilePicture}
            onLogout={handleLogout}
            onProfileUpdate={handleProfileUpdate}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatArea 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onLikeMessage={handleLikeMessage}
            onDislikeMessage={handleDislikeMessage}
            userProfilePicture={adminConfig.userProfilePicture}
            username={adminConfig.username}
          />
        </div>
        <div className="flex-shrink-0">
          <ChatInput 
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}