import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  speechRecognitionService, 
  SpeechRecognitionResult, 
  SpeechRecognitionError,
  SpeechRecognitionOptions
} from '../lib/speech-recognition';

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  startListening: (options?: SpeechRecognitionOptions) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const isSupported = speechRecognitionService.isSupported();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  const startListening = useCallback((options: SpeechRecognitionOptions = {}) => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    setError(null);
    resetTranscript();

    const onResult = (result: SpeechRecognitionResult) => {
      if (result.isFinal) {
        setFinalTranscript(prev => prev + result.transcript);
        setInterimTranscript('');
        setTranscript(prev => prev + result.transcript);
      } else {
        setInterimTranscript(result.transcript);
        setTranscript(finalTranscript + result.transcript);
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a timeout to stop listening after 10 seconds of no speech
      timeoutRef.current = setTimeout(() => {
        speechRecognitionService.stopListening();
      }, 10000);
    };

    const onError = (speechError: SpeechRecognitionError) => {
      setError(speechError.message);
      setIsListening(false);
      
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const onEnd = () => {
      setIsListening(false);
      
      // Clear timeout when recognition ends
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const started = speechRecognitionService.startListening(
      onResult,
      onError,
      onEnd,
      {
        language: 'en-US',
        continuous: false,
        interimResults: true,
        maxAlternatives: 1,
        ...options
      }
    );

    if (started) {
      setIsListening(true);
    } else {
      setError('Failed to start speech recognition');
    }
  }, [isSupported, finalTranscript, resetTranscript]);

  const stopListening = useCallback(() => {
    speechRecognitionService.stopListening();
    
    // Clear timeout when manually stopping
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}