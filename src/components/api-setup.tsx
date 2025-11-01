import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ExternalLink, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { updateGeminiApiKey, geminiService } from '../lib/gemini';

interface ApiSetupProps {
  onApiKeySet: (apiKey: string) => void;
}

export function ApiSetup({ onApiKeySet }: ApiSetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setTestResult(null);
    
    try {
      // Validate API key format
      const trimmedKey = apiKey.trim();
      
      if (!trimmedKey.startsWith('AIza')) {
        setTestResult({ success: false, error: 'API key should start with "AIza"' });
        setIsValidating(false);
        return;
      }
      
      if (trimmedKey.length < 35) {
        setTestResult({ success: false, error: 'API key seems too short. Please check that you copied the complete key.' });
        setIsValidating(false);
        return;
      }
      
      // Additional validation to check for common copy-paste errors
      if (trimmedKey.includes(' ') || trimmedKey.includes('\n') || trimmedKey.includes('\t')) {
        setTestResult({ success: false, error: 'API key contains invalid characters. Please ensure you copied it correctly.' });
        setIsValidating(false);
        return;
      }
      
      // Test the API key by making a connection
      updateGeminiApiKey(trimmedKey);
      const connectionTest = await geminiService.testConnection();
      
      if (connectionTest.success) {
        setTestResult({ success: true });
        setTimeout(() => {
          onApiKeySet(trimmedKey);
        }, 1000);
      } else {
        setTestResult({ 
          success: false, 
          error: connectionTest.error || 'Failed to connect to Gemini API'
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        error: 'An error occurred while validating the API key. Please try again.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Setup Gemini API</CardTitle>
          <CardDescription>
            Enter your Google Gemini API key to start chatting with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Don't have an API key? Get one for free from Google AI Studio.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                Gemini API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!apiKey.trim() || isValidating}
            >
              {isValidating ? 'Testing Connection...' : testResult?.success ? 'Connected! Starting...' : 'Start Chatting'}
            </Button>
            
            {/* Test Result */}
            {testResult && (
              <div className={`flex items-center gap-2 text-sm mt-2 ${
                testResult.success 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {testResult.success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    API key is valid and working!
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    {testResult.error}
                  </>
                )}
              </div>
            )}
          </form>

          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Get API Key from Google AI Studio
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Your API key is stored locally in your browser and never sent to our servers.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}