import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Mail, Phone, Edit2, Save, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface UserProfileProps {
  username: string;
  email?: string | null;
  isGuest?: boolean;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  mobileNo?: string;
  onLogout?: () => void;
  onProfileUpdate?: (firstName: string, lastName: string, mobileNo: string) => Promise<void>;
}

export function UserProfile({ 
  username, 
  email, 
  isGuest, 
  profilePicture,
  firstName,
  lastName,
  mobileNo,
  onLogout,
  onProfileUpdate
}: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState(firstName || '');
  const [editLastName, setEditLastName] = useState(lastName || '');
  const [editMobileNo, setEditMobileNo] = useState(mobileNo || '');
  const [isSaving, setIsSaving] = useState(false);

  // Get the display name - prioritize username, fallback to email or Guest
  const displayName = username || (isGuest ? 'Guest' : email?.split('@')[0] || 'User');
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsOpen(false);
  };

  const handleEdit = () => {
    setEditFirstName(firstName || '');
    setEditLastName(lastName || '');
    setEditMobileNo(mobileNo || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditFirstName(firstName || '');
    setEditLastName(lastName || '');
    setEditMobileNo(mobileNo || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editFirstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (onProfileUpdate) {
        await onProfileUpdate(
          editFirstName.trim(),
          editLastName.trim(),
          editMobileNo.trim()
        );
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto rounded-full hover:bg-accent transition-all"
        >
          {/* Status indicator */}
          <div className={`h-2 w-2 rounded-full ${isGuest ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
          
          {/* Profile picture or avatar */}
          {profilePicture ? (
            <div className="w-7 h-7 rounded-full overflow-hidden border border-border">
              <ImageWithFallback 
                src={profilePicture} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
              {getInitials(displayName)}
            </div>
          )}
          
          {/* Username - hidden on small screens */}
          <span className="hidden sm:inline-block text-sm font-medium text-foreground max-w-[120px] truncate">
            {displayName}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-72 p-0 overflow-hidden" 
        align="end"
        sideOffset={8}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header with gradient background */}
              <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-white">
                <div className="flex items-center gap-4">
                  {/* Large profile picture */}
                  {profilePicture ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                      <ImageWithFallback 
                        src={profilePicture} 
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border-2 border-white/30 shadow-lg">
                      <span className="text-xl font-semibold">{getInitials(displayName)}</span>
                    </div>
                  )}
                  
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-lg">{displayName}</h3>
                    <p className="text-xs text-white/80 truncate">
                      {isGuest ? 'Guest User' : 'Registered User'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile details */}
              <div className="p-4 space-y-3">
                {/* Edit mode header */}
                {!isGuest && !isEditing && (
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Profile Information</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                )}

                {isEditing && !isGuest && (
                  <div className="space-y-3 mb-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-first-name" className="text-xs">First Name *</Label>
                      <Input
                        id="edit-first-name"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="Enter first name"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-last-name" className="text-xs">Last Name</Label>
                      <Input
                        id="edit-last-name"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="Enter last name"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-mobile" className="text-xs">Mobile Number</Label>
                      <Input
                        id="edit-mobile"
                        value={editMobileNo}
                        onChange={(e) => setEditMobileNo(e.target.value)}
                        placeholder="+1234567890"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <>
                    {/* First Name */}
                    {!isGuest && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">First Name</p>
                          <p className="text-sm">{firstName || 'Not set'}</p>
                        </div>
                      </div>
                    )}

                    {/* Last Name */}
                    {!isGuest && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Last Name</p>
                          <p className="text-sm">{lastName || 'Not set'}</p>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {email && !isGuest && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm break-all">{email}</p>
                        </div>
                      </div>
                    )}

                    {/* Mobile Number */}
                    {!isGuest && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Mobile Number</p>
                          <p className="text-sm">{mobileNo || 'Not set'}</p>
                        </div>
                      </div>
                    )}

                    {/* Account status */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`h-4 w-4 rounded-full ${isGuest ? 'bg-yellow-500' : 'bg-green-500'} mt-0.5 flex-shrink-0 shadow-sm`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="text-sm font-medium">
                          {isGuest ? 'Active (Temporary)' : 'Active'}
                        </p>
                      </div>
                    </div>

                    {/* Session info for guests */}
                    {isGuest && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                          <strong>Note:</strong> Guest sessions are temporary. Sign in to save your conversations permanently.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-border p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}
