import image_56f79910b020325b35d4c1e848eabcdf1b62ea2a from 'figma:asset/56f79910b020325b35d4c1e848eabcdf1b62ea2a.png';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ShieldCheck, Sparkles, ArrowRight, LogIn, UserX, User, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { toast } from 'sonner@2.0.3';
import { sendOTPEmail as sendOTP } from '../lib/email-service';
import brothersAiLogo from 'figma:asset/3bd87f6c03c2bd56071fc9b5b5e3ac2e4afb93a8.png';

interface AuthPageProps {
  onAuthSuccess: (userId: string, email: string, name: string, isNewUser?: boolean) => void;
  onSkipLogin: () => void;
}

export function AuthPage({ onAuthSuccess, onSkipLogin }: AuthPageProps) {
  const [step, setStep] = useState<'email' | 'password' | 'otp' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  // Generate a random 6-digit OTP
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleEmailSubmit = async () => {
    // Email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (email.length > 100) {
      toast.error('Email address is too long (max 100 characters)');
      return;
    }

    setIsLoading(true);
    try {
      // Check if user exists with password in our database
      const { supabase } = await import('../lib/supabase');
      
      // Try to check if email column exists first
      let existingUser = null;
      try {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('user_id, email, first_name, last_name, password')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        
        if (!fetchError) {
          existingUser = data;
        } else if (fetchError.message.includes('email') || fetchError.code === 'PGRST204') {
          // Email column doesn't exist yet - user needs to run migration
          // Silent fallback
        }
      } catch (dbError) {
        // Silent fallback
      }

      if (existingUser && existingUser.password) {
        // User has a password, show password input
        setHasPassword(true);
        setStep('password');
        setIsNewUser(false);
        setIsLoading(false);
        return;
      }

      // Generate and send OTP
      const otpCode = generateOTP();
      
      // Send OTP via EmailJS
      const sent = await sendOTP({
        email: email.trim().toLowerCase(),
        otpCode: otpCode,
        userName: 'User'
      });
      
      if (!sent) {
        // EmailJS not configured - show error and don't proceed
        toast.error('Email service not configured. Please contact administrator.');
        setIsLoading(false);
        return;
      }
      
      // OTP sent successfully
      setGeneratedOTP(otpCode);
      toast.success('OTP sent to your email! Please check your inbox.');
      
      setIsNewUser(!existingUser);
      if (existingUser) {
        setTempUserId(existingUser.user_id);
      }
      
      setStep('otp');
    } catch (error) {
      toast.error('Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    // Password validation
    if (!password || password.length === 0) {
      toast.error('Please enter your password');
      return;
    }
    if (password.length > 128) {
      toast.error('Password is too long');
      return;
    }

    setIsLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      
      // Verify password from our database (plain text comparison)
      const { data: user, error } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, email, password')
        .eq('email', email.trim().toLowerCase())
        .eq('password', password)
        .maybeSingle();

      if (error) {
        toast.error('Login failed. Database may need migration. Try OTP instead.');
        setIsLoading(false);
        return;
      }

      if (!user) {
        toast.error('Invalid password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success - save auth and login
      toast.success('Login successful! 🎉');
      
      // Use first_name if available, fallback to 'You'
      const displayName = user.first_name || 'You';
      
      localStorage.setItem('brothers_ai_auth', JSON.stringify({
        userId: user.user_id,
        email: user.email,
        name: displayName,
        firstName: user.first_name,
        lastName: user.last_name,
        isGuest: false,
        authenticatedAt: Date.now()
      }));
      
      onAuthSuccess(user.user_id, user.email, displayName);
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP matches
      if (otp !== generatedOTP) {
        toast.error('Invalid code. Please try again.');
        setIsLoading(false);
        return;
      }

      const { supabase } = await import('../lib/supabase');

      if (isNewUser) {
        // New user - show profile form
        // Use email as user ID
        setTempUserId(email.trim().toLowerCase());
        setStep('details');
        toast.success('OTP verified! Please complete your profile.');
      } else {
        // Existing user - login directly
        
        let existingUser = null;
        let dbError = null;
        
        try {
          const { data, error } = await supabase
            .from('users')
            .select('user_id, first_name, last_name, email')
            .eq('user_id', tempUserId)
            .single();
          
          existingUser = data;
          dbError = error;
        } catch (err) {
          dbError = err;
        }

        // Login even if database fails - use email as fallback
        const userId = existingUser?.user_id || tempUserId;
        // Use first_name if available, fallback to first part of email
        const userName = existingUser?.first_name || email.split('@')[0];
        const userEmail = existingUser?.email || email;

        toast.success('Welcome back! 🎉');
        localStorage.setItem('brothers_ai_auth', JSON.stringify({
          userId: userId,
          email: userEmail,
          name: userName,
          isGuest: false,
          authenticatedAt: Date.now()
        }));
        
        // Existing users are not new
        onAuthSuccess(userId, userEmail, userName, false);

        // Show warning if database had issues
        if (dbError) {
          setTimeout(() => {
            toast.warning('Database connection issue. Your data may not sync. Check RLS policies.', { duration: 5000 });
          }, 1000);
        }
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    // First name validation
    if (!firstName.trim()) {
      toast.error('Please enter your first name');
      return;
    }
    if (firstName.trim().length < 2) {
      toast.error('First name must be at least 2 characters');
      return;
    }
    if (firstName.trim().length > 50) {
      toast.error('First name is too long (max 50 characters)');
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(firstName.trim())) {
      toast.error('First name can only contain letters, spaces, hyphens, and apostrophes');
      return;
    }

    // Last name validation
    if (!lastName.trim()) {
      toast.error('Please enter your last name');
      return;
    }
    if (lastName.trim().length < 2) {
      toast.error('Last name must be at least 2 characters');
      return;
    }
    if (lastName.trim().length > 50) {
      toast.error('Last name is too long (max 50 characters)');
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(lastName.trim())) {
      toast.error('Last name can only contain letters, spaces, hyphens, and apostrophes');
      return;
    }

    // Phone validation (if provided)
    if (phone.trim() && phone.trim() !== '+91' && phone.trim() !== '+91 ') {
      // Indian mobile number: +91 followed by 10 digits
      const phoneRegex = /^\+91\s?\d{10}$/;
      const cleanPhone = phone.trim().replace(/\s+/g, ' '); // Normalize spaces
      if (!phoneRegex.test(cleanPhone)) {
        toast.error('Please enter a valid Indian mobile number (+91 followed by 10 digits)');
        return;
      }
    }

    // Password validation (if provided)
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (newPassword.length > 128) {
        toast.error('Password is too long (max 128 characters)');
        return;
      }
    }

    setIsLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      
      // Use the new createOrUpdateUserWithAuth function
      const { createOrUpdateUserWithAuth } = await import('../lib/supabase');
      const userId = await createOrUpdateUserWithAuth(
        email.trim().toLowerCase(),
        newPassword.trim() || '',
        firstName.trim(),
        lastName.trim(),
        phone.trim() || undefined
      );
      
      let error = null;
      if (!userId) {
        error = { message: 'Failed to create user' };
      }

      // Handle specific errors
      if (error) {
        // RLS Policy Error
        if (error.code === '42501') {
          toast.error('⚠️ Database permission error! Run /FIX_RLS_POLICY.sql in Supabase', { duration: 8000 });
          setIsLoading(false);
          return;
        }
        
        // Schema Error - email column doesn't exist
        if (error.message?.includes('email') || error.code === 'PGRST204') {
          toast.warning('⚠️ Database needs migration. Creating basic profile...', { duration: 5000 });
          
          // Fallback: create basic user profile (using new schema)
          const fullName = `${firstName.trim()} ${lastName.trim()}`;
          const { error: fallbackError } = await supabase
            .from('users')
            .upsert({
              user_id: tempUserId,
              email: email.trim().toLowerCase(),
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (fallbackError) {
            if (fallbackError.code === '42501') {
              toast.error('⚠️ Database permission error! Run /FIX_RLS_POLICY.sql in Supabase', { duration: 8000 });
            } else {
              toast.error('Failed to create profile. Check Supabase permissions.');
            }
            
            setIsLoading(false);
            return;
          }
        } else {
          // Other errors
          toast.error('Failed to create profile. Check console for details.');
          setIsLoading(false);
          return;
        }
      }

      // Success
      toast.success('Profile created successfully! 🎉');
      localStorage.setItem('brothers_ai_auth', JSON.stringify({
        userId: tempUserId, // This is the email now
        email: email,
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isGuest: false,
        authenticatedAt: Date.now()
      }));
      
      // This is a new user
      onAuthSuccess(tempUserId, email, firstName.trim(), true);
    } catch (error) {
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Generate guest session
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('brothers_ai_auth', JSON.stringify({
      userId: guestId,
      email: null,
      isGuest: true,
      authenticatedAt: Date.now()
    }));
    toast.info('Continuing as guest');
    onSkipLogin();
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setPassword('');
    setHasPassword(false);
    setGeneratedOTP('');
  };

  const handleUseOTP = async () => {
    // Send OTP instead of using password
    setIsLoading(true);
    try {
      const otpCode = generateOTP();
      setGeneratedOTP(otpCode);
      
      // Send OTP via EmailJS
      const sent = await sendOTP({
        email: email.trim().toLowerCase(),
        otpCode: otpCode,
        userName: 'User'
      });
      
      if (sent) {
        toast.success('OTP sent to your email! Please check your inbox.');
      } else {
        // EmailJS not configured - show error (no OTP displayed)
        toast.error('Email service not configured. Please contact administrator.');
      }

      setStep('otp');
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main auth card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          {/* Logo and header */}
          <motion.div
            className="flex flex-col items-center mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative mb-4">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <img
                src={image_56f79910b020325b35d4c1e848eabcdf1b62ea2a}
                alt="Brother's AI"
                className="w-20 h-20 rounded-full relative z-10"
              />
            </div>
            <h1 className="text-2xl font-semibold text-center mb-2">
              Welcome to Brother's AI
            </h1>
            <p className="text-muted-foreground text-center text-sm">
              Sign in with email OTP or continue as guest
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Email input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="abhijeetbudhak@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEmailSubmit();
                      }
                    }}
                    className="h-12"
                    disabled={isLoading}
                    maxLength={100}
                    autoComplete="email"
                  />
                </div>

                {/* Continue button */}
                <Button
                  onClick={handleEmailSubmit}
                  disabled={isLoading || !email}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                {/* Skip login button */}
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Continue as Guest
                </Button>

                {/* Info text */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    <strong>🔐 Secure Login:</strong> We'll send a 6-digit code to your email. No password needed!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>👤 Guest Mode:</strong> Skip login to try the chatbot without an account. Your data won't be saved permanently.
                  </p>

                </div>
              </motion.div>
            ) : step === 'password' ? (
              <motion.div
                key="password-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Email display */}
                <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Logging in as</p>
                    <p className="text-sm font-medium truncate">{email}</p>
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePasswordLogin();
                        }
                      }}
                      className="h-12 pr-10"
                      disabled={isLoading}
                      maxLength={128}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Login button */}
                <Button
                  onClick={handlePasswordLogin}
                  disabled={isLoading || !password}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Login with Password
                    </>
                  )}
                </Button>

                {/* Use OTP instead */}
                <Button
                  onClick={handleUseOTP}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Use OTP Instead
                </Button>

                {/* Back button */}
                <Button
                  onClick={handleBackToEmail}
                  variant="ghost"
                  className="w-full"
                  disabled={isLoading}
                >
                  Change Email
                </Button>
              </motion.div>
            ) : step === 'otp' ? (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Email display */}
                <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Verification code sent to</p>
                    <p className="text-sm font-medium truncate">{email}</p>
                  </div>
                </div>

                {/* OTP Delivery Status */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                    <strong>📧 OTP Delivery:</strong> Check your email inbox for the verification code.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    💡 <strong>Note:</strong> If EmailJS is not configured, the OTP appears in the notification above.
                  </p>
                </div>

                {/* OTP input */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Enter 6-Digit Code
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {/* Verify button */}
                <Button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Verify & Continue
                    </>
                  )}
                </Button>

                {/* Back button */}
                <Button
                  onClick={handleBackToEmail}
                  variant="ghost"
                  className="w-full"
                  disabled={isLoading}
                >
                  Change Email
                </Button>

                {/* Resend link */}
                <div className="text-center">
                  <button
                    onClick={handleEmailSubmit}
                    disabled={isLoading}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
                    aria-label="Resend OTP code"
                    title="Resend OTP code"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </motion.div>
            ) : step === 'details' ? (
              <motion.div
                key="details-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-4">
                  <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Help us personalize your experience
                  </p>
                </div>

                {/* First Name input */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Abhijeet"
                    value={firstName}
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens, and apostrophes
                      const value = e.target.value;
                      if (value === '' || /^[a-zA-Z\s'-]*$/.test(value)) {
                        setFirstName(value);
                      }
                    }}
                    className="h-12"
                    disabled={isLoading}
                    maxLength={50}
                    minLength={2}
                    autoComplete="given-name"
                    required
                  />
                </div>

                {/* Last Name input */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Budhak"
                    value={lastName}
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens, and apostrophes
                      const value = e.target.value;
                      if (value === '' || /^[a-zA-Z\s'-]*$/.test(value)) {
                        setLastName(value);
                      }
                    }}
                    className="h-12"
                    disabled={isLoading}
                    maxLength={50}
                    minLength={2}
                    autoComplete="family-name"
                    required
                  />
                </div>

                {/* Phone input */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => {
                      let value = e.target.value;
                      
                      // Always ensure it starts with +91
                      if (!value.startsWith('+91')) {
                        value = '+91 ' + value.replace(/^\+91\s*/, '');
                      }
                      
                      // Only allow +91 followed by space and digits
                      if (value === '+91' || value === '+91 ' || /^\+91\s?\d{0,10}$/.test(value)) {
                        setPhone(value);
                      }
                    }}
                    onFocus={(e) => {
                      // If empty, set to +91
                      if (e.target.value === '' || e.target.value === '+91') {
                        setPhone('+91 ');
                      }
                    }}
                    className="h-12"
                    disabled={isLoading}
                    maxLength={14}
                    autoComplete="tel"
                  />
                  {phone.length > 4 && phone.length < 14 && (
                    <p className="text-xs text-muted-foreground">
                      {14 - phone.length} more digit{14 - phone.length !== 1 ? 's' : ''} needed
                    </p>
                  )}
                </div>

                {/* Password input */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Set Password <span className="text-xs text-muted-foreground">(optional - skip OTP next time)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-12 pr-10"
                      disabled={isLoading}
                      maxLength={128}
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        💡 Setting a password allows you to login quickly without OTP
                      </p>
                      {newPassword.length > 0 && newPassword.length < 6 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-500">
                          ⚠️ Password must be at least 6 characters ({6 - newPassword.length} more needed)
                        </p>
                      )}
                      {newPassword.length >= 6 && (
                        <p className="text-xs text-green-600 dark:text-green-500">
                          ✓ Password strength: {newPassword.length >= 12 ? 'Strong' : newPassword.length >= 8 ? 'Good' : 'Fair'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Complete button */}
                <Button
                  onClick={handleCompleteProfile}
                  disabled={isLoading || !firstName.trim() || !lastName.trim()}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Complete Profile
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Created in collaboration with Abhijeet Budhak , Rohit Lade , Subhash Yadav , Abhishek yadav
          • Powered by Gemini AI
        </motion.p>
      </motion.div>
    </div>
  );
}
