import { Profile, Message } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface UserListProps {
  users: Profile[];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  currentUserId: string;
  lastMessages: Record<string, Message>;
}

export const UserList = ({ users, selectedUserId, onSelectUser, currentUserId, lastMessages }: UserListProps) => {
  const getLastMessagePreview = (userId: string) => {
    const lastMsg = lastMessages[userId];
    if (!lastMsg) return null;
    
    const isFromMe = lastMsg.sender_id === currentUserId;
    const prefix = isFromMe ? 'You: ' : '';
    const text = lastMsg.message.length > 30 
      ? lastMsg.message.slice(0, 30) + '...' 
      : lastMsg.message;
    
    return { text: prefix + text, isUnread: !isFromMe && !lastMsg.seen };
  };
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastSeenText = (profile: Profile) => {
    if (profile.is_online) return 'Online';
    return `Last seen ${formatDistanceToNow(new Date(profile.last_seen), { addSuffix: true })}`;
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-card-foreground">Chats</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No other users yet
            </p>
          ) : (
            users.map(user => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.user_id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                  "hover:bg-accent/50",
                  selectedUserId === user.user_id && "bg-accent"
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card",
                      user.is_online ? "bg-green-500" : "bg-muted"
                    )}
                  />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-card-foreground truncate">
                    {user.name}
                  </p>
                  {(() => {
                    const preview = getLastMessagePreview(user.user_id);
                    if (preview) {
                      return (
                        <p className={cn(
                          "text-xs truncate",
                          preview.isUnread ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {preview.text}
                        </p>
                      );
                    }
                    return (
                      <p className="text-xs text-muted-foreground truncate">
                        {getLastSeenText(user)}
                      </p>
                    );
                  })()}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
