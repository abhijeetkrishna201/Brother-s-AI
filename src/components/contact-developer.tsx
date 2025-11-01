import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Mail, Linkedin, Instagram, ExternalLink, User, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { FeedbackDialog } from './feedback-dialog';
import developerPhoto from 'figma:asset/42644af8ba5ab875b9ea82fb6eaefcb59d3b53ba.png';

interface ContactDeveloperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string | null;
}

export function ContactDeveloper({ open, onOpenChange, userId }: ContactDeveloperProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  const contactInfo = {
    name: 'Abhijeet Krishna Budhak',
    email: 'abhibudhak@gmail.com',
    instagram: 'abhijeetkrishna201',
    linkedin: 'https://www.linkedin.com/in/abhijeet-krishnapad-budhak-9073a12b6/'
  };

  const handleEmailClick = () => {
    window.open(`mailto:${contactInfo.email}`, '_blank');
  };

  const handleInstagramClick = () => {
    window.open(`https://www.instagram.com/${contactInfo.instagram}`, '_blank');
  };

  const handleLinkedInClick = () => {
    window.open(contactInfo.linkedin, '_blank');
  };

  const handleFeedbackClick = () => {
    setIsFeedbackOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Contact Developer
            </DialogTitle>
            <DialogDescription>
              Get in touch with the creator of Brother's AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Developer Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={developerPhoto} 
                  alt={contactInfo.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border shadow-md"
                />
                <div>
                  <h3 className="font-medium text-foreground">{contactInfo.name}</h3>
                  <p className="text-xs text-muted-foreground">Creator & Developer</p>
                </div>
              </div>
            </motion.div>

            {/* Feedback Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                variant="default"
                className="w-full justify-start gap-3 h-auto p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                onClick={handleFeedbackClick}
              >
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Send Feedback</p>
                  <p className="text-xs text-white/80">Share your thoughts about Brother's AI</p>
                </div>
              </Button>
            </motion.div>

            {/* Contact Methods */}
            <div className="space-y-2">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto p-4 hover:bg-accent"
                  onClick={handleEmailClick}
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground truncate">{contactInfo.email}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Button>
              </motion.div>

              {/* Instagram */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto p-4 hover:bg-accent"
                  onClick={handleInstagramClick}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Instagram className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Instagram</p>
                    <p className="text-xs text-muted-foreground">@{contactInfo.instagram}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Button>
              </motion.div>

              {/* LinkedIn */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto p-4 hover:bg-accent"
                  onClick={handleLinkedInClick}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Linkedin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">LinkedIn</p>
                    <p className="text-xs text-muted-foreground">Professional Profile</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Button>
              </motion.div>
            </div>

            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-4 border-t border-border"
            >
              <p className="text-xs text-center text-muted-foreground">
                B.Tech Computer Science & Engineering<br />
                Ballarpur Institute of Technology
              </p>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={isFeedbackOpen} 
        onOpenChange={setIsFeedbackOpen}
        userId={userId}
      />
    </>
  );
}
