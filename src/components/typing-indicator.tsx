import { motion } from 'motion/react';
import { Avatar, AvatarFallback } from './ui/avatar';

export function TypingIndicator() {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -10 }
  };

  const containerVariants = {
    initial: { opacity: 0, x: -50, scale: 0.95 },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 1
      }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div 
      className="group flex gap-4 p-6 bg-muted/30"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          AI
        </AvatarFallback>
      </Avatar>

      {/* Typing Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-foreground">
            Brother's AI
          </span>
          <span className="text-xs text-muted-foreground">
            typing...
          </span>
        </div>
        
        {/* Typing Animation */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
              variants={dotVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatType: "reverse",
                delay: index * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}