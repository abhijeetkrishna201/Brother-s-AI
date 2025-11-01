import { useRef, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { ChatMessage } from './chat-message';
import { TypingIndicator } from './typing-indicator';
import { Button } from './ui/button';
import { Sparkles, Code, Image, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import brothersLogo from 'figma:asset/15850bbd12277d0214c91f369932e3b0676bf389.png';

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

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string, attachments?: FileAttachment[]) => void;
  isLoading?: boolean;
  onLikeMessage?: (messageId: string) => void;
  onDislikeMessage?: (messageId: string) => void;
  userProfilePicture?: string;
  username?: string;
}

const quickPrompts = [
  {
    icon: Code,
    title: "Code Review",
    description: "Review my code for best practices",
    prompt: "Can you review this code and suggest improvements for best practices, performance, and maintainability?"
  },
  {
    icon: FileText,
    title: "Write Content",
    description: "Help me write professional content",
    prompt: "Help me write professional content for my project. I need something that's clear, engaging, and well-structured."
  },
  {
    icon: Image,
    title: "Design Ideas",
    description: "Generate creative design concepts",
    prompt: "I need creative design ideas for my project. Can you suggest some modern, user-friendly design concepts?"
  },
  {
    icon: Sparkles,
    title: "Brainstorm",
    description: "Generate innovative ideas",
    prompt: "Let's brainstorm some innovative ideas. I'm looking for creative solutions and fresh perspectives."
  }
];

export function ChatArea({ messages, onSendMessage, isLoading = false, onLikeMessage, onDislikeMessage, userProfilePicture, username }: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added or when loading state changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl text-center px-4">
          {/* Welcome Header */}
          <motion.div 
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div 
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-4 sm:mb-6 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 to-slate-700"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              <ImageWithFallback 
                src={brothersLogo} 
                alt="Brothers AI - Aditya, Kaushik, Abhijeet" 
                className="w-full h-full object-contain p-2"
              />
            </motion.div>
            <motion.h1 
              className="mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Welcome to Brother's AI 🎇🎉
            </motion.h1>
            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              I'm here to help you with coding, writing, design, and more. What would you like to work on today?
            </motion.p>
          </motion.div>

          {/* Quick Prompts */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.8
                }
              }
            }}
          >
            {quickPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.title}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.9 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }
                  }
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start text-left hover:bg-accent w-full"
                  onClick={() => onSendMessage(prompt.prompt)}
                >
                  <div className="flex items-center gap-3 mb-2 w-full">
                    <prompt.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{prompt.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {prompt.description}
                  </p>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        <div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                onLikeMessage={onLikeMessage}
                onDislikeMessage={onDislikeMessage}
                userProfilePicture={userProfilePicture}
                username={username}
              />
            ))}
          </motion.div>
          
          {/* Typing Indicator */}
          <AnimatePresence>
            {isLoading && <TypingIndicator />}
          </AnimatePresence>
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>
    </div>
  );
}