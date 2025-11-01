import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { checkDatabaseConnection } from '../lib/supabase';

interface DatabaseStatusProps {
  isDatabaseReady: boolean;
}

export function DatabaseStatus({ isDatabaseReady }: DatabaseStatusProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    async function checkStatus() {
      const isConnected = await checkDatabaseConnection();
      setStatus(isConnected ? 'connected' : 'disconnected');
      
      // Auto-hide after 5 seconds if connected
      if (isConnected) {
        setTimeout(() => setIsVisible(false), 5000);
      }
    }

    checkStatus();
  }, [isDatabaseReady]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-50"
      >
        <div
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm
            ${status === 'connected' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700' 
              : status === 'disconnected'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
            }
          `}
        >
          {status === 'checking' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Connecting to database...</span>
            </>
          )}
          {status === 'connected' && (
            <>
              <Cloud className="h-4 w-4" />
              <span className="text-sm font-medium">Cloud database connected</span>
            </>
          )}
          {status === 'disconnected' && (
            <>
              <CloudOff className="h-4 w-4" />
              <span className="text-sm font-medium">Using local storage</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
