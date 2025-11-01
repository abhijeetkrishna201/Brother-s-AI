import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, MessageSquarePlus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { submitFeedback } from '../lib/database-service';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string | null;
}

export function FeedbackDialog({ open, onOpenChange, userId }: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare feedback data
      const feedbackData = {
        feedback: feedback.trim(),
        name: name.trim() || undefined,
        contact: contact.trim() || undefined,
        feedbackType: 'general' as const
      };

      // Submit to database
      const feedbackId = await submitFeedback(feedbackData, userId);
      
      if (feedbackId) {
        setIsSuccess(true);
        toast.success('Feedback saved successfully! Thank you for your input.');
        
        // Reset form after delay
        setTimeout(() => {
          setFeedback('');
          setName('');
          setContact('');
          setIsSubmitting(false);
          setIsSuccess(false);
          onOpenChange(false);
        }, 2500);
      } else {
        throw new Error('Failed to save feedback');
      }
    } catch (error) {
      toast.error('Failed to save feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFeedback('');
    setName('');
    setContact('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquarePlus className="h-5 w-5 text-primary" />
                  Share Your Feedback
                </DialogTitle>
                <DialogDescription>
                  Help us improve Brother's AI by sharing your thoughts and suggestions
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Feedback Text */}
          <div className="space-y-2">
            <Label htmlFor="feedback">
              Your Feedback <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think about Brother's AI..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
              className="resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              Share your experience, suggestions, or report any issues
            </p>
          </div>

          {/* Optional Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border"
          >
            <p className="text-sm font-medium">Optional Information</p>
            
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Details</Label>
              <Input
                id="contact"
                type="text"
                placeholder="Email or phone (optional)"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We'll only use this if we need to follow up on your feedback
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !feedback.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>

          {/* Privacy Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pt-2 border-t border-border"
          >
            <p className="text-xs text-center text-muted-foreground">
              Your feedback will be securely stored in our database for review
            </p>
          </motion.div>
        </form>
      </motion.div>
    ) : (
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, type: "spring" }}
        className="py-8 flex flex-col items-center justify-center text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </motion.div>
        <h3 className="text-lg font-medium mb-2">Feedback Sent!</h3>
        <p className="text-sm text-muted-foreground">
          Thank you for helping us improve Brother's AI
        </p>
      </motion.div>
    )}
    </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
