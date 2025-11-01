/**
 * Speech recognition utilities and hooks for voice input functionality
 */

// Check if the browser supports speech recognition
export const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && 
         ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

// Get the speech recognition constructor
export const getSpeechRecognition = (): typeof SpeechRecognition | null => {
  if (typeof window === 'undefined') return null;
  
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionError {
  error: string;
  message: string;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    const SpeechRecognitionConstructor = getSpeechRecognition();
    if (SpeechRecognitionConstructor) {
      this.recognition = new SpeechRecognitionConstructor();
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: SpeechRecognitionError) => void,
    onEnd: () => void,
    options: SpeechRecognitionOptions = {}
  ): boolean {
    if (!this.recognition || this.isListening) {
      return false;
    }

    // Configure recognition
    this.recognition.lang = options.language || 'en-US';
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives || 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        onResult({
          transcript,
          confidence,
          isFinal: result.isFinal
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError({
        error: event.error,
        message: this.getErrorMessage(event.error)
      });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    // Start recognition
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech':
        return 'No speech was detected. Please try again.';
      case 'audio-capture':
        return 'No microphone was found. Please check your microphone connection.';
      case 'not-allowed':
        return 'Microphone access was denied. Please allow microphone access and try again.';
      case 'network':
        return 'Network error occurred. Please check your internet connection.';
      case 'language-not-supported':
        return 'The selected language is not supported.';
      case 'service-not-allowed':
        return 'Speech recognition service is not allowed in this context.';
      default:
        return `Speech recognition error: ${error}`;
    }
  }
}

// Singleton instance
export const speechRecognitionService = new SpeechRecognitionService();

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}