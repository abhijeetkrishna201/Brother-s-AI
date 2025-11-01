import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';
import { FilePreview } from './file-preview';
import { motion } from 'motion/react';
import { copyToClipboard, selectElementText } from '../lib/copy-utils';
import { ImageWithFallback } from './figma/ImageWithFallback';
import brothersLogo from 'figma:asset/15850bbd12277d0214c91f369932e3b0676bf389.png';
import userAvatar from 'figma:asset/9468a2a945fdccaafef131dee9c968de9c1f9fbd.png';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    attachments?: FileAttachment[];
  };
  onLikeMessage?: (messageId: string) => void;
  onDislikeMessage?: (messageId: string) => void;
  userProfilePicture?: string;
  username?: string;
}

export function ChatMessage({ message, onLikeMessage, onDislikeMessage, userProfilePicture, username }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const handleCopy = async () => {
    setCopyError(false);
    
    const result = await copyToClipboard(message.content);
    
    if (result.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Try to select the text for manual copying
      const messageElement = document.querySelector(`[data-message-id="${message.id}"] p`);
      
      if (messageElement && selectElementText(messageElement as HTMLElement)) {
        setCopyError(true);
        setTimeout(() => {
          setCopyError(false);
          // Clear selection after showing the message
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            selection.removeAllRanges();
          }
        }, 4000);
      } else {
        // Show a fallback error
        setCopyError(true);
        setTimeout(() => setCopyError(false), 4000);
      }
    }
  };

  const handleLike = () => {
    if (!liked && onLikeMessage) {
      setLiked(true);
      setDisliked(false); // Reset dislike if previously disliked
      onLikeMessage(message.id);
    }
  };

  const handleDislike = () => {
    if (!disliked && onDislikeMessage) {
      setDisliked(true);
      setLiked(false); // Reset like if previously liked
      onDislikeMessage(message.id);
    }
  };

  // Animation variants for user and AI messages
  const messageVariants = {
    user: {
      initial: { opacity: 0, x: 50, scale: 0.95 },
      animate: { 
        opacity: 1, 
        x: 0, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 1
        }
      }
    },
    assistant: {
      initial: { opacity: 0, x: -50, scale: 0.95 },
      animate: { 
        opacity: 1, 
        x: 0, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 1,
          delay: 0.1
        }
      }
    }
  };

  return (
    <motion.div 
      className={`group flex gap-4 p-6 ${
        message.role === 'assistant' ? 'bg-muted/30' : ''
      }`}
      variants={messageVariants[message.role]}
      initial="initial"
      animate="animate"
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        {message.role === 'assistant' ? (
          <AvatarImage src={brothersLogo} alt="Brothers AI - Created by Abhijeet Krishna Budhak" className="object-contain" />
        ) : (
          <AvatarImage src={userProfilePicture || userAvatar} alt={username || "Abhijeet Krishna Budhak"} className="object-cover" />
        )}
        <AvatarFallback className={
          message.role === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
        }>
          {message.role === 'user' ? (username ? username.substring(0, 2).toUpperCase() : 'AK') : 'AI'}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-foreground">
            {message.role === 'user' ? (username || 'You') : "Brother's Ai"}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp}
          </span>
        </div>
        
        {/* File Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {message.attachments.map((file) => (
                <FilePreview key={file.id} file={file} />
              ))}
            </div>
          </div>
        )}

        {/* Message Content */}
        {message.content && (
          <div className="prose prose-sm max-w-none text-foreground" data-message-id={message.id}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {/* Message Actions */}
        {message.role === 'assistant' && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className={`h-8 px-2 transition-colors ${
                  copied 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                    : copyError 
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    : ''
                }`}
              >
                <motion.div
                  animate={copied || copyError ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Copy className="h-4 w-4" />
                </motion.div>
                {copied ? 'Copied!' : copyError ? 'Text Selected - Press Ctrl+C' : 'Copy'}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-8 px-2 transition-colors ${liked ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}`}
                onClick={handleLike}
                disabled={liked}
              >
                <motion.div
                  animate={liked ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                </motion.div>
                {liked ? 'Liked' : 'Like'}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-8 px-2 transition-colors ${disliked ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}`}
                onClick={handleDislike}
                disabled={disliked}
              >
                <motion.div
                  animate={disliked ? { scale: [1, 1.2, 1], rotate: [0, -10, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <ThumbsDown className={`h-4 w-4 ${disliked ? 'fill-current' : ''}`} />
                </motion.div>
                {disliked ? 'Disliked' : 'Dislike'}
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}