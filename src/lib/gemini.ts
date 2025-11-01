import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize with your API key (loaded from database via admin panel)
// No hardcoded API key - must be configured in admin settings
let API_KEY = '';
let genAI = new GoogleGenerativeAI(API_KEY || 'placeholder');

// Check if API key is configured
function isApiKeyConfigured(): boolean {
  return API_KEY !== '' && API_KEY !== 'YOUR_API_KEY_HERE';
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: FileAttachment[];
}

// Convert file to base64 for Gemini API
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Convert blob URL to File object
async function blobUrlToFile(blobUrl: string, fileName: string): Promise<File> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
}

export class GeminiService {
  public model;
  public modelNames = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-pro'
  ];
  public currentModelIndex = 0;

  constructor() {
    this.initializeModel();
  }

  public initializeModel() {
    const modelName = this.modelNames[this.currentModelIndex];
    this.model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });
  }

  private async tryNextModel(): Promise<void> {
    if (this.currentModelIndex < this.modelNames.length - 1) {
      this.currentModelIndex++;
      this.initializeModel();
    } else {
      throw new Error('All available models have been tried');
    }
  }

  async generateResponse(
    message: string,
    attachments: FileAttachment[] = [],
    conversationHistory: ChatMessage[] = [],
    retryCount: number = 0
  ): Promise<string> {
    const maxRetries = 3; // Increased retries for better reliability with overloaded servers
    
    // Check if API key is configured
    if (!isApiKeyConfigured()) {
      throw new Error('API key not configured. Please configure your API key in the admin settings.');
    }
    
    try {
      // Prepare the conversation context
      const contextMessages = conversationHistory.slice(-10); // Keep last 10 messages for context
      
      let prompt = '';
      
      // Add conversation history as context
      if (contextMessages.length > 0) {
        prompt += 'Previous conversation:\n';
        contextMessages.forEach(msg => {
          prompt += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}\n`;
        });
        prompt += '\n---\n\n';
      }

      // Add current message
      prompt += `User: ${message}`;

      // Handle attachments if present
      const parts: any[] = [{ text: prompt }];

      if (attachments.length > 0) {
        for (const attachment of attachments) {
          try {
            // Only process image files for now
            if (attachment.type.startsWith('image/')) {
              const file = await blobUrlToFile(attachment.url, attachment.name);
              const base64Data = await fileToBase64(file);
              
              parts.push({
                inlineData: {
                  data: base64Data,
                  mimeType: attachment.type
                }
              });
            } else {
              // For non-image files, just mention them in the text
              parts[0].text += `\n\nNote: User attached a file named "${attachment.name}" (${attachment.type})`;
            }
          } catch (error) {
            parts[0].text += `\n\nNote: User attached a file named "${attachment.name}" but it couldn't be processed.`;
          }
        }
      }

      const result = await this.model.generateContent(parts);
      const response = await result.response;
      let text = response.text();

      // Clean up any unwanted prefixes from the AI response
      text = text.replace(/^(Assistant|assistant):\s*/i, '');
      text = text.replace(/^(AI|ai):\s*/i, '');
      
      return text;
      
    } catch (error) {
      // Try fallback model for 404 errors (model not found)
      if (error instanceof Error && error.message.includes('404')) {
        try {
          await this.tryNextModel();
          return this.generateResponse(message, attachments, conversationHistory, 0);
        } catch (fallbackError) {
          // All models failed
        }
      }

      // Retry logic for transient errors
      if (retryCount < maxRetries && error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Retry for network errors, timeouts, or server errors
        if (errorMessage.includes('network') || 
            errorMessage.includes('timeout') || 
            errorMessage.includes('overload') ||
            errorMessage.includes('502') || 
            errorMessage.includes('503') || 
            errorMessage.includes('504')) {
          
          console.log(`⏳ Retrying request (attempt ${retryCount + 2}/${maxRetries + 1})...`);
          console.log(`Waiting ${Math.pow(2, retryCount)} seconds before retry...`);
          
          // Wait before retry (exponential backoff: 1s, 2s, 4s)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          
          return this.generateResponse(message, attachments, conversationHistory, retryCount + 1);
        }
      }
      
      // Provide a helpful error message based on the error type
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('overload') || errorMessage.includes('503')) {
          return '🔄 The Gemini AI service is currently experiencing high traffic and is overloaded. This is a temporary issue with Google\'s servers. Please wait a few moments and try again. If the issue persists, try using a shorter message or wait 1-2 minutes.';
        }
        if (errorMessage.includes('api_key') || errorMessage.includes('api key')) {
          return '🔑 Please check your Gemini API key. You can get one from https://aistudio.google.com/app/apikey';
        }
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          return '📊 API quota exceeded. Please check your Gemini API usage limits at https://aistudio.google.com';
        }
        if (errorMessage.includes('safety')) {
          return '⚠️ Your message was filtered for safety reasons. Please try rephrasing your request.';
        }
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          return '❌ The requested model is not available. Please check your API key and ensure you have access to Gemini models. Make sure you\'re using the standard Gemini API (not Vertex AI).';
        }
        if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          return '🚫 Permission denied. Please check your API key permissions and billing setup at https://console.cloud.google.com';
        }
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          return '🌐 Network error. Please check your internet connection and try again.';
        }
        if (errorMessage.includes('429')) {
          return '⏱️ Too many requests. Please wait a moment before trying again.';
        }
      }
      
      return 'Sorry, I encountered an error while processing your request. Please try again.';
    }
  }

  // Method to check if API key is configured
  isConfigured(): boolean {
    return API_KEY !== 'YOUR_GEMINI_API_KEY_HERE' && API_KEY.length > 0;
  }

  // Method to test API connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.model.generateContent('Hello');
      const response = await result.response;
      response.text(); // Just to verify we can get text
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Function to update API key dynamically
export function updateGeminiApiKey(apiKey: string) {
  API_KEY = apiKey;
  genAI = new GoogleGenerativeAI(API_KEY);
  // Reset model index and reinitialize
  geminiService.currentModelIndex = 0;
  geminiService.initializeModel();
}

export const geminiService = new GeminiService();