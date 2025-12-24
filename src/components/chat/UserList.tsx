import { Profile, Group, Message } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Users } from 'lucide-react';
import { CreateGroupDialog } from './CreateGroupDialog';

interface UserListProps {
  users: Profile[];
  groups: Group[];
  selectedUserId: string | null;
  selectedGroupId: string | null;
  onSelectUser: (userId: string) => void;
  onSelectGroup: (groupId: string) => void;
  currentUserId: string;
  lastMessages: Record<string, Message>;
  groupLastMessages: Record<string, Message>;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<{ error: Error | null }>;
  getReportCount: (userId: string) => number;
}

export const UserList = ({
  users,
  groups,
  selectedUserId,
  selectedGroupId,
  onSelectUser,
  onSelectGroup,
  currentUserId,
  lastMessages,
  groupLastMessages,
  onCreateGroup,
  getReportCount
}: UserListProps) => {
  const getLastMessagePreview = (userId: string) => {
    const lastMsg = lastMessages[userId];
    if (!lastMsg) return null;
    
    const isFromMe = lastMsg.sender_id === currentUserId;
    const prefix = isFromMe ? 'You: ' : '';
    let text = lastMsg.message;
    
    if (!text && lastMsg.file_type) {
      text = lastMsg.file_type === 'gif' ? 'GIF' : lastMsg.file_type === 'image' ? 'Photo' : 'File';
    }
    
    text = text.length > 30 ? text.slice(0, 30) + '...' : text;
    
    return { text: prefix + text, isUnread: !isFromMe && !lastMsg.seen, time: lastMsg.created_at };
  };

  const getGroupLastMessagePreview = (groupId: string) => {
    const lastMsg = groupLastMessages[groupId];
    if (!lastMsg) return null;
    
    const isFromMe = lastMsg.sender_id === currentUserId;
    const prefix = isFromMe ? 'You: ' : '';
    let text = lastMsg.message;
    
    if (!text && lastMsg.file_type) {
      text = lastMsg.file_type === 'gif' ? 'GIF' : lastMsg.file_type === 'image' ? 'Photo' : 'File';
    }
    
    text = text.length > 25 ? text.slice(0, 25) + '...' : text;
    
    return { text: prefix + text, time: lastMsg.created_at };
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

  // Sort users by last message time
  const sortedUsers = [...users].sort((a, b) => {
    const msgA = lastMessages[a.user_id];
    const msgB = lastMessages[b.user_id];
    
    if (!msgA && !msgB) return 0;
    if (!msgA) return 1;
    if (!msgB) return -1;
    
    return new Date(msgB.created_at).getTime() - new Date(msgA.created_at).getTime();
  });

  // Sort groups by last message time
  const sortedGroups = [...groups].sort((a, b) => {
    const msgA = groupLastMessages[a.id];
    const msgB = groupLastMessages[b.id];
    
    if (!msgA && !msgB) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (!msgA) return 1;
    if (!msgB) return -1;
    
    return new Date(msgB.created_at).getTime() - new Date(msgA.created_at).getTime();
  });

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">Chats</h2>
        <CreateGroupDialog users={users} onCreateGroup={onCreateGroup} />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Groups Section */}
          {sortedGroups.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground px-3 py-2">Groups</p>
              {sortedGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                    "hover:bg-accent/50",
                    selectedGroupId === group.id && "bg-accent"
                  )}
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center border-2 border-border">
                      <Users className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-card-foreground truncate">{group.name}</p>
                    {(() => {
                      const preview = getGroupLastMessagePreview(group.id);
                      if (preview) {
                        return (
                          <p className="text-xs text-muted-foreground truncate">
                            {preview.text}
                          </p>
                        );
                      }
                      return (
                        <p className="text-xs text-muted-foreground truncate">
                          Tap to start chatting
                        </p>
                      );
                    })()}
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Users Section */}
          {sortedUsers.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground px-3 py-2 mt-2">Direct Messages</p>
              {sortedUsers.map(user => {
                const reportCount = getReportCount(user.user_id);
                return (
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
                    <Avatar className={cn(
                      "h-12 w-12 border-2",
                      reportCount >= 3 ? "border-destructive" : reportCount >= 2 ? "border-orange-500" : reportCount >= 1 ? "border-yellow-500" : "border-border"
                    )}>
                      <AvatarFallback className={cn(
                        "font-medium",
                        reportCount >= 3 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                      )}>
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
                );
              })}
            </>
          )}

          {users.length === 0 && groups.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No chats yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
