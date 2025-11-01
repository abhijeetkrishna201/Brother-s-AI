import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Plus, MessageSquare, MoreHorizontal, Trash2, MessageSquarePlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';
import { FeedbackDialog } from './feedback-dialog';
import { useState } from 'react';
import brothersLogo from 'figma:asset/15850bbd12277d0214c91f369932e3b0676bf389.png';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  attachments?: any[];
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
  messages: Message[];
}

interface ChatSidebarProps {
  activeConversation: string | null;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatSidebar({ 
  activeConversation, 
  conversations,
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation
}: ChatSidebarProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
  };

  return (
    <div className="w-full h-full bg-card border-r border-border flex flex-col overflow-hidden relative">
      {/* Feedback Dialog */}
      <FeedbackDialog
        open={isFeedbackOpen}
        onOpenChange={setIsFeedbackOpen}
      />

      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        {/* Brothers AI Branding */}
        <div className="mb-4 flex items-center gap-3 px-2">
          <motion.div 
            className="w-8 h-8 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-slate-800 to-slate-600 p-0.5 flex items-center justify-center flex-shrink-0"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ 
              scale: 1, 
              rotate: 0
            }}
            transition={{ 
              duration: 0.6, 
              ease: "easeOut", 
              delay: 0.1
            }}
          >
            <ImageWithFallback 
              src={brothersLogo} 
              alt="Brothers AI" 
              className="w-full h-full object-contain rounded-md"
            />
          </motion.div>
          <div className="flex-1 min-w-0">
            <motion.h2 
              className="font-medium text-foreground truncate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Brothers AI
            </motion.h2>
            <motion.p 
              className="text-xs text-muted-foreground truncate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Innovation. Together.
            </motion.p>
          </div>
        </div>
        
        <Button 
          onClick={onNewConversation}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No conversations yet.<br />
                Start a new conversation!
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative rounded-lg p-3 mb-2 cursor-pointer transition-colors hover:bg-accent ${
                    activeConversation === conversation.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-foreground truncate">
                          {conversation.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {conversation.preview}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {conversation.timestamp}
                        </span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                          aria-label="Conversation options"
                          title="More options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Floating Feedback Button */}
      <motion.div
        className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsFeedbackOpen(true)}
          className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-400 dark:hover:to-purple-400"
          size="icon"
          aria-label="Send feedback to developer"
          title="Send Feedback"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
        <span className="text-xs font-medium text-foreground">Feedback</span>
      </motion.div>
    </div>
  );
}