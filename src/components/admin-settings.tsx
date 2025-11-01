import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Settings, Key, User, Image, MessageSquare, LogOut, Save, Upload, Mail, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

export interface AdminConfig {
  apiKey: string;
  username: string;
  userProfilePicture: string;
  defaultMessage: string;
  emailJsServiceId: string;
  emailJsTemplateId: string;
  emailJsPublicKey: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

interface AdminSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AdminConfig;
  onConfigUpdate: (config: AdminConfig) => void;
  onLogout: () => void;
}

export function AdminSettings({ open, onOpenChange, config, onConfigUpdate, onLogout }: AdminSettingsProps) {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [username, setUsername] = useState(config.username);
  const [userProfilePicture, setUserProfilePicture] = useState(config.userProfilePicture);
  const [defaultMessage, setDefaultMessage] = useState(config.defaultMessage);
  const [emailJsServiceId, setEmailJsServiceId] = useState(config.emailJsServiceId);
  const [emailJsTemplateId, setEmailJsTemplateId] = useState(config.emailJsTemplateId);
  const [emailJsPublicKey, setEmailJsPublicKey] = useState(config.emailJsPublicKey);
  const [supabaseUrl, setSupabaseUrl] = useState(config.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(config.supabaseAnonKey || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiKey(config.apiKey);
    setUsername(config.username);
    setUserProfilePicture(config.userProfilePicture);
    setDefaultMessage(config.defaultMessage);
    setEmailJsServiceId(config.emailJsServiceId);
    setEmailJsTemplateId(config.emailJsTemplateId);
    setEmailJsPublicKey(config.emailJsPublicKey);
    setSupabaseUrl(config.supabaseUrl || '');
    setSupabaseAnonKey(config.supabaseAnonKey || '');
  }, [config]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setUserProfilePicture(base64String);
      toast.success('Image uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to upload image');
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    const newConfig: AdminConfig = {
      apiKey,
      username,
      userProfilePicture,
      defaultMessage,
      emailJsServiceId,
      emailJsTemplateId,
      emailJsPublicKey,
      supabaseUrl,
      supabaseAnonKey
    };
    onConfigUpdate(newConfig);
    toast.success('Settings saved successfully! Refresh the page for database changes to take effect.');
  };

  const handleLogout = () => {
    onLogout();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Admin Settings
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </DialogTitle>
          <DialogDescription>
            Manage your Brother's AI configuration settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="database" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="database">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="h-4 w-4 mr-2" />
              API
            </TabsTrigger>
            <TabsTrigger value="user">
              <User className="h-4 w-4 mr-2" />
              User
            </TabsTrigger>
            <TabsTrigger value="avatar">
              <Image className="h-4 w-4 mr-2" />
              Avatar
            </TabsTrigger>
            <TabsTrigger value="message">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              EmailJS
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="database" className="mt-0 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium mb-2">🗄️ Supabase Configuration</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Configure your Supabase database connection. All data including conversations, users, and settings are stored in Supabase.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Get your credentials from <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Dashboard</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabaseUrl">Supabase Project URL</Label>
                <Input
                  id="supabaseUrl"
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your Supabase project URL (e.g., https://xxxxx.supabase.co)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabaseAnonKey">Supabase Anon Key</Label>
                <Input
                  id="supabaseAnonKey"
                  type="password"
                  placeholder="Your Supabase anonymous key"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your Supabase anonymous (public) key from Project Settings → API
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">⚠️ Important Notes</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>After changing database settings, refresh the page for changes to take effect</li>
                  <li>Make sure you've run all SQL schema files in your Supabase database</li>
                  <li>The anon key is safe to expose in frontend code (public API key)</li>
                  <li>Never share your service role key - only use the anon key here</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">🚀 Quick Setup Guide</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">Supabase.com</a></li>
                  <li>Go to Project Settings → API</li>
                  <li>Copy your Project URL and anon public key</li>
                  <li>Run the SQL schema files in SQL Editor (in order)</li>
                  <li>Paste credentials above and click Save</li>
                  <li>Refresh the page to connect to your database</li>
                </ol>
              </div>

              {supabaseUrl && supabaseAnonKey && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                >
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ Supabase is configured! Your data will be stored in the cloud.
                  </p>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="api" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Gemini API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is stored locally and never shared. Get your key from{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="user" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Display Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter display username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This name will be displayed above your messages in the chat and in your profile button
                </p>
              </div>
            </TabsContent>

            <TabsContent value="avatar" className="mt-0 space-y-4">
              <div className="space-y-4">
                {/* File Upload Section */}
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">Upload Profile Picture</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="fileUpload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUploadClick}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image File
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Upload an image file (JPG, PNG, GIF, etc.) - Max size: 2MB
                  </p>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* URL Input Section */}
                <div className="space-y-2">
                  <Label htmlFor="userProfilePicture">User Profile Picture URL</Label>
                  <Input
                    id="userProfilePicture"
                    type="text"
                    placeholder="Enter image URL"
                    value={userProfilePicture}
                    onChange={(e) => setUserProfilePicture(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This image will appear in your chat messages and profile button
                  </p>
                </div>
                
                {/* Preview Section */}
                {userProfilePicture && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 border border-border rounded-lg bg-muted/20"
                  >
                    <p className="text-sm mb-3">Preview:</p>
                    <div className="flex items-center gap-4">
                      <img
                        src={userProfilePicture}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-border shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm">{username || 'User'}</p>
                        <p className="text-xs text-muted-foreground">How it will appear in chat</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="message" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultMessage">Default AI Introduction Message</Label>
                <Textarea
                  id="defaultMessage"
                  placeholder="Enter the default introduction message"
                  value={defaultMessage}
                  onChange={(e) => setDefaultMessage(e.target.value)}
                  rows={10}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This message appears when users start a new conversation or ask "Who are you?"
                </p>
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-0 space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">📧 EmailJS Configuration</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Configure EmailJS to send OTP verification codes via email during user authentication.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Get your credentials from <a href="https://dashboard.emailjs.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium">EmailJS Dashboard</a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailJsServiceId">Service ID</Label>
                  <Input
                    id="emailJsServiceId"
                    type="text"
                    placeholder="service_xxxxxxx"
                    value={emailJsServiceId}
                    onChange={(e) => setEmailJsServiceId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your EmailJS Service ID (e.g., service_abc123)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailJsTemplateId">Template ID</Label>
                  <Input
                    id="emailJsTemplateId"
                    type="text"
                    placeholder="template_xxxxxxx"
                    value={emailJsTemplateId}
                    onChange={(e) => setEmailJsTemplateId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your EmailJS Template ID (e.g., template_xyz789)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailJsPublicKey">Public Key</Label>
                  <Input
                    id="emailJsPublicKey"
                    type="password"
                    placeholder="Your public key"
                    value={emailJsPublicKey}
                    onChange={(e) => setEmailJsPublicKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your EmailJS Public Key from Account settings
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">🚀 Quick Setup Guide</h4>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Create free account at <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">EmailJS.com</a></li>
                    <li>Add an Email Service (Gmail, Outlook, etc.)</li>
                    <li>Create an Email Template with variables: to_email, to_name, otp_code</li>
                    <li>Copy your Service ID, Template ID, and Public Key</li>
                    <li>Paste them in the fields above and click Save</li>
                  </ol>
                </div>

                {emailJsServiceId && emailJsTemplateId && emailJsPublicKey && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                  >
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ✅ EmailJS is configured! OTP emails will be sent to users during authentication.
                    </p>
                  </motion.div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
