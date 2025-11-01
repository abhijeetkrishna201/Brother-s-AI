import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Lock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface AdminLoginProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

// Fallback credentials (if database is not available)
const FALLBACK_USERNAME = 'abhijeetkrishna201';
const FALLBACK_PASSWORD = 'abhijeet@408166';

export function AdminLogin({ open, onOpenChange, onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Try to verify credentials from database first
      const { verifyAdminCredentials } = await import('../lib/supabase');
      const isValidDb = await verifyAdminCredentials(username, password);
      
      if (isValidDb) {
        // Database authentication successful
        sessionStorage.setItem('admin_session', 'authenticated');
        sessionStorage.setItem('admin_session_time', Date.now().toString());
        toast.success('Admin login successful!');
        onLoginSuccess();
        onOpenChange(false);
        setUsername('');
        setPassword('');
        setIsLoading(false);
        return;
      }
      
      // Fallback to hardcoded credentials if database fails
      if (username === FALLBACK_USERNAME && password === FALLBACK_PASSWORD) {
        sessionStorage.setItem('admin_session', 'authenticated');
        sessionStorage.setItem('admin_session_time', Date.now().toString());
        toast.info('Admin login successful (using fallback credentials)');
        onLoginSuccess();
        onOpenChange(false);
        setUsername('');
        setPassword('');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      // Database error - use fallback
      if (username === FALLBACK_USERNAME && password === FALLBACK_PASSWORD) {
        sessionStorage.setItem('admin_session', 'authenticated');
        sessionStorage.setItem('admin_session_time', Date.now().toString());
        toast.info('Admin login successful (database offline)');
        onLoginSuccess();
        onOpenChange(false);
        setUsername('');
        setPassword('');
      } else {
        setError('Invalid username or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Admin Login
          </DialogTitle>
          <DialogDescription>
            Enter your admin credentials to access settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Only authorized administrators can access this section
        </p>
      </DialogContent>
    </Dialog>
  );
}
