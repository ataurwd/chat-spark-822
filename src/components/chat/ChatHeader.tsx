import { useNavigate } from 'react-router-dom';
import { Profile } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, MessageCircle, Shield } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatHeaderProps {
  profile: Profile;
  onSignOut: () => void;
  isAdmin?: boolean;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const ChatHeader = ({ 
  profile, 
  onSignOut, 
  isAdmin,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead
}: ChatHeaderProps) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-7 w-7" />
        <h1 className="text-xl font-bold">ChatFlow</h1>
      </div>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="text-primary-foreground hover:bg-primary-foreground/10"
            title="Admin Panel"
          >
            <Shield className="h-5 w-5" />
          </Button>
        )}
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-sm font-medium">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:block">{profile.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSignOut}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
