import { createClient } from '@supabase/supabase-js';

// Supabase configuration - loaded from database via admin settings
// Default values (fallback if not configured)
let SUPABASE_URL = 'https://lfgffpfenynxhvxicdue.supabase.co';
let SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZ2ZmcGZlbnlueGh2eGljZHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzQxNDAsImV4cCI6MjA3NTI1MDE0MH0.Er8efWbWXw8-Wi6T1uGNBl0M89RKIGtwfmrEsQUvvKg';

// Create Supabase client
export let supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to update Supabase configuration dynamically
export function updateSupabaseConfig(url: string, anonKey: string) {
  SUPABASE_URL = url;
  SUPABASE_ANON_KEY = anonKey;
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Function to get current configuration
export function getSupabaseConfig() {
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };
}

// Database types for new schema
export interface DbUser {
  user_id: string;        // Email address
  email: string;
  password?: string;
  mobile_no?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

export interface DbChatHistory {
  chat_id: string;        // user_id + chat_rank (e.g., "user@example.com5")
  user_id: string;
  user_request: string;
  ai_response: string;
  chat_rank: number;
  created_at: string;
  updated_at: string;
}

// Helper function to get or create user session
export function getUserSessionId(): string {
  let sessionId = localStorage.getItem('brothers_ai_user_session');
  
  if (!sessionId) {
    // Generate a unique session ID
    sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('brothers_ai_user_session', sessionId);
  }
  
  return sessionId;
}

// Initialize or update user in database (new schema)
export async function initializeUser(
  userId: string, 
  firstName?: string, 
  profilePicture?: string,
  email?: string,
  lastName?: string,
  mobileNo?: string
) {
  try {
    // Check if user exists (user_id is the primary key)
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingUser) {
      // Update user if needed
      const updates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (firstName) updates.first_name = firstName;
      if (lastName) updates.last_name = lastName;
      if (profilePicture) updates.profile_picture = profilePicture;
      if (mobileNo) updates.mobile_no = mobileNo;

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', userId);

      if (updateError) {
        // Silent error
      }
      
      return existingUser;
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        email: email || userId,
        first_name: firstName || '',
        last_name: lastName || '',
        mobile_no: mobileNo || null,
        profile_picture: profilePicture || null,
        password: null, // Will be set during registration
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newUser;
  } catch (error) {
    return null;
  }
}

// Create or update user with password (for auth)
export async function createOrUpdateUserWithAuth(
  email: string,
  password: string,
  firstName: string,
  lastName?: string,
  mobileNo?: string
) {
  try {
    const userId = email.trim().toLowerCase();
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: password,
          first_name: firstName,
          last_name: lastName || '',
          mobile_no: mobileNo || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        return null;
      }
      
      return userId;
    }

    // Create new user
    const { error: createError } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        email: userId,
        password: password,
        first_name: firstName,
        last_name: lastName || '',
        mobile_no: mobileNo || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (createError) {
      return null;
    }

    return userId;
  } catch (error) {
    return null;
  }
}

// Check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// ADMIN TABLE FUNCTIONS
// ============================================================================

export interface AdminConfig {
  admin_id: string;
  username: string;
  password: string;
  gemini_api_key?: string;
  user_profile_picture?: string;
  default_message?: string;
  emailjs_service_id?: string;
  emailjs_template_id?: string;
  emailjs_public_key?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch admin configuration from database
 */
export async function fetchAdminConfig(): Promise<AdminConfig | null> {
  try {
    const { data, error } = await supabase
      .from('admin')
      .select('*')
      .eq('admin_id', 'admin_001')
      .single();

    if (error) {
      return null;
    }

    return data as AdminConfig;
  } catch (error) {
    return null;
  }
}

/**
 * Update admin configuration in database
 */
export async function updateAdminConfig(config: Partial<AdminConfig>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('admin_id', 'admin_001');

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verify admin credentials
 */
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin')
      .select('username, password')
      .eq('admin_id', 'admin_001')
      .single();

    if (error || !data) {
      return false;
    }

    return data.username === username && data.password === password;
  } catch (error) {
    return false;
  }
}

/**
 * Update Gemini API Key
 */
export async function updateGeminiApiKeyInDb(apiKey: string): Promise<boolean> {
  return await updateAdminConfig({ gemini_api_key: apiKey });
}

/**
 * Update default message
 */
export async function updateDefaultMessage(message: string): Promise<boolean> {
  return await updateAdminConfig({ default_message: message });
}

/**
 * Update EmailJS settings
 */
export async function updateEmailJsSettings(
  serviceId: string,
  templateId: string,
  publicKey: string
): Promise<boolean> {
  return await updateAdminConfig({
    emailjs_service_id: serviceId,
    emailjs_template_id: templateId,
    emailjs_public_key: publicKey
  });
}
