import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Paperclip, Mic, MicOff, Square } from 'lucide-react';
import { FilePreview } from './file-preview';
import { motion } from 'motion/react';
import { useSpeechRecognition } from '../hooks/use-speech-recognition';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: FileAttachment[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    isSupported: isSpeechSupported,
    transcript,
    interimTranscript,
    finalTranscript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const fileAttachment: FileAttachment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      };
      
      setAttachments(prev => [...prev, fileAttachment]);
    });
    
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, stopListening, resetTranscript, startListening]);

  // Update message when transcript changes
  useEffect(() => {
    if (transcript && !isListening) {
      // Only update if we have a transcript and we're not currently listening
      setMessage(prev => {
        const newMessage = prev + (prev ? ' ' : '') + transcript;
        return newMessage;
      });
      resetTranscript();

      // Auto-resize textarea after adding voice input
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
      }
    }
  }, [transcript, isListening, resetTranscript]);

  // Keyboard shortcut for voice toggle (Ctrl/Cmd + M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key === 'm' && isSpeechSupported && !disabled) {
        e.preventDefault();
        handleVoiceToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleVoiceToggle, isSpeechSupported, disabled]);

  return (
    <div className="border-t border-border bg-background p-2 sm:p-4">
      <motion.form 
        onSubmit={handleSubmit} 
        className="mx-auto max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl px-2 sm:px-0"
        animate={disabled ? { scale: 0.98, opacity: 0.7 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* File Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {attachments.map((file) => (
                <FilePreview
                  key={file.id}
                  file={file}
                  onRemove={() => handleRemoveAttachment(file.id)}
                  showRemove={true}
                />
              ))}
            </div>
          </div>
        )}

        <div className="relative flex items-end gap-1 sm:gap-2">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0"
            disabled={disabled}
            onClick={handleFileSelect}
            aria-label="Attach files"
            title="Attach files"
          >
            <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          {/* Text input */}
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Brother's AI ...."
              disabled={disabled}
              className="min-h-[44px] max-h-[200px] resize-none pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base"
              rows={1}
            />
            
            {/* Voice input button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`absolute right-1 sm:right-2 top-1.5 sm:top-2 h-6 w-6 sm:h-8 sm:w-8 p-0 transition-colors ${
                isListening 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                  : isSpeechSupported 
                  ? 'hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              disabled={disabled || !isSpeechSupported}
              onClick={handleVoiceToggle}
              aria-label={
                !isSpeechSupported 
                  ? 'Speech recognition not supported' 
                  : isListening 
                  ? 'Stop recording' 
                  : 'Start voice input'
              }
              title={
                !isSpeechSupported 
                  ? 'Speech recognition not supported' 
                  : isListening 
                  ? 'Stop recording' 
                  : 'Start voice input'
              }
            >
              <motion.div
                animate={isListening ? { 
                  scale: [1, 1.1, 1], 
                  rotate: [0, 2, -2, 0] 
                } : { scale: 1, rotate: 0 }}
                transition={{ 
                  duration: isListening ? 1.5 : 0.2, 
                  repeat: isListening ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className="flex items-center justify-center"
              >
                {isListening ? (
                  <Square className="h-2 w-2 sm:h-3 sm:w-3 fill-current" />
                ) : !isSpeechSupported ? (
                  <MicOff className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </motion.div>
            </Button>
          </div>

          {/* Send button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="submit"
              size="sm"
              className="h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0"
              disabled={disabled || (!message.trim() && attachments.length === 0)}
              aria-label="Send message"
              title="Send message"
            >
              <motion.div
                animate={disabled ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: disabled ? Infinity : 0, ease: "linear" }}
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.json,.csv,.xlsx,.pptx"
        />
        
        {/* Voice recognition status and live transcript */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-2 h-2 bg-red-500 rounded-full"
              />
              Listening... Speak now
            </div>
            
            {/* Live transcript preview */}
            {(finalTranscript || interimTranscript) && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <div className="text-blue-800 dark:text-blue-200">
                  <span className="opacity-100">{finalTranscript}</span>
                  <span className="opacity-60 italic">{interimTranscript}</span>
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block w-1 h-4 bg-blue-600 ml-1"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Voice recognition error */}
        {speechError && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 text-sm text-red-600 dark:text-red-400 text-center"
          >
            {speechError}
          </motion.div>
        )}

        <div className="text-xs text-muted-foreground mt-2 text-center space-y-1">
          <p>Brother's AI can make mistakes. Consider checking important information.</p>
          {isSpeechSupported && (
            <p>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">alt+M</kbd> to toggle voice input</p>
          )}
        </div>
      </motion.form>
    </div>
  );
}