import { Button } from './ui/button';
import { Sun, Moon, Menu, ShieldCheck, Phone } from 'lucide-react';
import { useTheme } from '../hooks/use-theme';
import { motion, AnimatePresence } from 'motion/react';
import { useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { UserProfile } from './user-profile';
import brothersLogo from 'figma:asset/15850bbd12277d0214c91f369932e3b0676bf389.png';

interface ChatHeaderProps {
  onToggleSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
  onAdminClick?: () => void;
  onContactClick?: () => void;
  userEmail?: string | null;
  isGuest?: boolean;
  username?: string;
  firstName?: string;
  lastName?: string;
  mobileNo?: string;
  profilePicture?: string;
  onLogout?: () => void;
  onProfileUpdate?: (firstName: string, lastName: string, mobileNo: string) => Promise<void>;
}

export function ChatHeader({ 
  onToggleSidebar, 
  isMobileSidebarOpen, 
  onAdminClick, 
  onContactClick, 
  userEmail, 
  isGuest,
  username,
  firstName,
  lastName,
  mobileNo,
  profilePicture,
  onLogout,
  onProfileUpdate
}: ChatHeaderProps) {
  const { toggleTheme, isDark, isTransitioning } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const handleThemeToggle = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      toggleTheme({ x, y });
    }
  };

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-1.5 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar menu"
              title="Toggle sidebar"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
          
          {/* Header with Logo - Centered on mobile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center md:justify-start md:flex-initial">
            <div 
              className="relative"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              <motion.div 
                className="w-8 h-8 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-slate-800 to-slate-600 p-0.5 flex items-center justify-center cursor-pointer relative z-20"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: isLogoHovered ? 1.5 : 1, 
                  rotate: 0,
                  y: isLogoHovered ? -8 : 0
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeOut",
                  scale: { duration: 0.3 },
                  y: { duration: 0.3 }
                }}
                whileHover={{ 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
                }}
              >
                <ImageWithFallback 
                  src={brothersLogo} 
                  alt="Brothers AI" 
                  className="w-full h-full object-contain rounded-md"
                />
                
                {/* Glowing effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400/20 to-purple-400/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isLogoHovered ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Outer glow ring */}
                <motion.div
                  className="absolute -inset-1 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: isLogoHovered ? 1 : 0,
                    scale: isLogoHovered ? 1.2 : 0.8
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>

              {/* Enhanced Tooltip */}
              <AnimatePresence>
                {isLogoHovered && (
                  <motion.div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 z-30"
                    initial={{ opacity: 0, y: -10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="bg-card border border-border rounded-3xl shadow-2xl p-10 w-[38rem] h-[30rem] overflow-hidden">
                      {/* Spacious Horizontal Layout */}
                      <div className="flex items-center h-full gap-10">
                        
                        {/* Large Logo Preview - Left Side */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center">
                          <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-600 p-4 flex items-center justify-center shadow-xl border border-slate-600/50">
                            <ImageWithFallback 
                              src={brothersLogo} 
                              alt="Brothers AI Preview" 
                              className="w-full h-full object-contain rounded-2xl"
                            />
                          </div>
                        </div>
                        
                        {/* Information Section - Right Side */}
                        <div className="flex-1 flex flex-col justify-center space-y-6 min-w-0">
                          
                          {/* Main Title Section */}
                          <div className="space-y-2">
                            <div className="text-xl font-medium text-foreground">Brothers AI</div>
                            <div className="text-sm text-muted-foreground">Innovation. Together.</div>
                          </div>
                          
                          {/* Creator Information Section */}
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">Created by</div>
                            <div className="text-base font-medium text-foreground">Abhijeet Krishna Budhak</div>
                            <div className="text-xs text-muted-foreground opacity-90 leading-relaxed">
                              B.Tech Computer Science & Engineering<br/>
                              Ballarpur Institute of Technology
                            </div>
                          </div>
                          
                          {/* Features Section */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                              <span className="text-base">🤖</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground">AI Assistant</div>
                                <div className="text-xs text-muted-foreground">Advanced conversational AI technology</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                              <span className="text-base">⚡</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground">Gemini Powered</div>
                                <div className="text-xs text-muted-foreground">Google's most advanced AI model</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                              <span className="text-base">🎯</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground">Problem Solving</div>
                                <div className="text-xs text-muted-foreground">Coding, research, analysis & more</div>
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-card border-l border-t border-border rotate-45"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <h1 className="text-xs sm:text-sm md:text-base lg:text-lg font-medium truncate hidden sm:block">Welcome to Brother's AI 🎇🎉</h1>
            <h1 className="text-xs font-medium truncate sm:hidden">Brother's AI</h1>
          </div>
          
          <div className="flex items-center justify-end gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
            {/* User Profile Button */}
            <div className="flex-shrink-0">
              <UserProfile
                username={username || 'You'}
                email={userEmail}
                isGuest={isGuest}
                firstName={firstName}
                lastName={lastName}
                mobileNo={mobileNo}
                profilePicture={profilePicture}
                onLogout={onLogout}
                onProfileUpdate={onProfileUpdate}
              />
            </div>

            {/* Contact Developer Button (Feedback) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onContactClick}
              className="p-1.5 sm:p-2 md:p-2.5 hover:bg-accent h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              title="Contact Developer"
              aria-label="Contact Developer"
            >
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </Button>

            {/* Admin Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdminClick}
              className="p-1.5 sm:p-2 md:p-2.5 hover:bg-accent h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              title="Admin Settings"
              aria-label="Admin Settings"
            >
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </Button>

            {/* Theme Toggle Button */}
            <motion.button
              ref={buttonRef}
              onClick={handleThemeToggle}
              disabled={isTransitioning}
              className={`
                relative overflow-hidden rounded-full p-1.5 sm:p-2 md:p-2.5
                bg-gradient-to-br transition-all duration-300 ease-out
                shadow-lg hover:shadow-xl active:scale-95
                border-2 group disabled:opacity-70 flex-shrink-0
                h-8 w-8 sm:h-9 sm:w-9
                ${isDark 
                  ? 'from-orange-400 via-yellow-400 to-yellow-300 border-yellow-300/30 hover:from-orange-300 hover:via-yellow-300 hover:to-yellow-200' 
                  : 'from-indigo-500 via-purple-500 to-blue-500 border-indigo-300/30 hover:from-indigo-400 hover:via-purple-400 hover:to-blue-400'
                }
              `}
              whileHover={{ scale: isTransitioning ? 1 : 1.05 }}
              whileTap={{ scale: isTransitioning ? 1 : 0.95 }}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {/* Background glow effect */}
              <div className={`
                absolute inset-0 rounded-full blur-xl opacity-30 transition-opacity duration-300
                ${isDark ? 'bg-yellow-400' : 'bg-purple-500'}
                group-hover:opacity-50
              `} />
              
              {/* Icon container */}
              <div className="relative z-10 flex items-center justify-center">
                <motion.div
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: 1, 
                    rotate: 0,
                    rotateY: isTransitioning ? 360 : 0
                  }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ 
                    duration: 0.3, 
                    ease: "easeOut",
                    rotateY: { duration: 0.6, ease: "easeInOut" }
                  }}
                >
                  {isDark ? (
                    <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white drop-shadow-sm" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white drop-shadow-sm" />
                  )}
                </motion.div>
              </div>

              {/* Enhanced ripple effect on click */}
              <motion.div
                className={`
                  absolute inset-0 rounded-full
                  ${isDark ? 'bg-yellow-300/30' : 'bg-purple-300/30'}
                `}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 0, opacity: 1 }}
                whileTap={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />

              {/* Transition pulse effect */}
              {isTransitioning && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/20"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ 
                    scale: [1, 1.2, 1], 
                    opacity: [0.5, 0.8, 0.5] 
                  }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}