import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { 
  Sparkles, 
  MessageSquare, 
  Zap, 
  Shield, 
  ArrowRight, 
  Brain,
  Cloud,
  FileImage,
  Mic,
  CheckCircle2,
  Star
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import brothersLogo from 'figma:asset/15850bbd12277d0214c91f369932e3b0676bf389.png';

interface WelcomeDialogProps {
  open: boolean;
  onStartConversation: () => void;
  username: string;
}

export function WelcomeDialog({ open, onStartConversation, username }: WelcomeDialogProps) {
  const features = [
    {
      icon: Brain,
      title: 'Powered by Gemini AI',
      description: 'Advanced AI for intelligent conversations',
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Cloud,
      title: 'Cloud Sync',
      description: 'Access your chats from anywhere',
      color: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected',
      color: 'from-pink-500 to-rose-500',
      iconBg: 'bg-pink-500/10',
      iconColor: 'text-pink-600 dark:text-pink-400'
    }
  ];

  const quickTips = [
    {
      icon: MessageSquare,
      text: 'Ask anything - coding, research, or general knowledge'
    },
    {
      icon: FileImage,
      text: 'Upload images and files for AI analysis'
    },
    {
      icon: Mic,
      text: 'Use voice input for hands-free interaction'
    },
    {
      icon: Zap,
      text: 'Get instant, intelligent responses powered by Google'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-[95vw] sm:max-w-[85vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] p-0 overflow-hidden border-0 bg-transparent shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative bg-background rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
          
          {/* Animated Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/20 rounded-full"
                initial={{
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%',
                  scale: 0
                }}
                animate={{
                  y: [null, Math.random() * 100 + '%'],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
          
          {/* Content Container */}
          <div className="relative z-10 flex flex-col max-h-[90vh]">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-4 py-6 sm:px-6 sm:py-8 flex-shrink-0">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              
              <div className="relative z-10 text-center space-y-3 sm:space-y-4">
                {/* Logo Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1 
                  }}
                  className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center shadow-2xl relative"
                >
                  <ImageWithFallback 
                    src={brothersLogo} 
                    alt="Brothers AI" 
                    className="w-full h-full object-contain rounded-xl p-2"
                  />
                  
                  {/* Rotating Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                  
                  {/* Sparkle Effect */}
                  <motion.div
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
                  </motion.div>
                </motion.div>

                {/* Welcome Text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="space-y-1.5 sm:space-y-2"
                >
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                    Welcome to Brother's AI! 🎉
                  </h1>
                  <motion.p 
                    className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    Hello, <span className="font-semibold">{username}</span>! Your account is ready!
                  </motion.p>
                </motion.div>

                {/* Success Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-300" />
                  <span className="text-xs text-white font-medium">Account Created Successfully</span>
                </motion.div>
              </div>
            </div>

            {/* Main Content - Scrollable */}
            <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30">
              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h2 className="flex items-center gap-2 mb-3 sm:mb-4 px-2">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-base sm:text-lg">What You Get</span>
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="group relative overflow-hidden"
                    >
                      {/* Card Background */}
                      <div className="relative p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-lg">
                        {/* Hover Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                        
                        {/* Content */}
                        <div className="relative z-10 space-y-2">
                          {/* Icon */}
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${feature.iconColor}`} />
                          </div>
                          
                          {/* Text */}
                          <div>
                            <h3 className="text-sm sm:text-base font-medium mb-1">{feature.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Tips Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-3 sm:p-4 border border-border/50"
              >
                <h3 className="flex items-center gap-2 mb-3 text-sm sm:text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Quick Start Guide</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {quickTips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="flex items-start gap-2 p-2 sm:p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <tip.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed pt-0.5 sm:pt-1">
                        {tip.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="pt-1"
              >
                <Button
                  onClick={onStartConversation}
                  className="w-full h-11 sm:h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 group text-sm sm:text-base"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Start Your First Conversation</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </motion.div>
                  </span>
                </Button>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="text-center space-y-1 pt-1"
              >
                <p className="text-xs text-muted-foreground">
                  Powered by Google's Gemini AI • Secure & Fast
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground/60">
                  Created with ❤️ by <span className="font-medium text-foreground/80">Abhijeet Krishna Budhak</span>
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
