import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useMessages } from '@/hooks/useMessages';
import { useGroupMessages } from '@/hooks/useGroupMessages';
import { useGroups } from '@/hooks/useGroups';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useLastMessages } from '@/hooks/useLastMessages';
import { useNotifications } from '@/hooks/useNotifications';

import { useAdmin } from '@/hooks/useAdmin';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { UserList } from '@/components/chat/UserList';
import { ChatArea } from '@/components/chat/ChatArea';
import { GroupChatArea } from '@/components/chat/GroupChatArea';
import { useToast } from '@/hooks/use-toast';

const Chat = () => {
  const { user, profile, signOut } = useAuth();
  const { users } = useUsers(user?.id);
  const { groups, groupMembers, createGroup } = useGroups(user?.id);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { messages, sendMessage } = useMessages(user?.id, selectedUserId);
  const { messages: groupMessages, sendMessage: sendGroupMessage } = useGroupMessages(user?.id, selectedGroupId);
  const { isUserTyping, setTyping } = useTypingIndicator(user?.id, selectedUserId);
  const { lastMessages, groupLastMessages } = useLastMessages(user?.id);
  
  const { isAdmin } = useAdmin(user?.id);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useUserNotifications(user?.id);
  const { toast } = useToast();
  
  // Enable notifications
  useNotifications(user?.id, selectedUserId, users);

  const selectedUser = users.find(u => u.user_id === selectedUserId) || null;
  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedGroupId(null);
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedUserId(null);
  };

  const handleSendMessage = async (
    message: string,
    fileUrl?: string,
    fileType?: string,
    fileName?: string
  ) => {
    const result = await sendMessage(message, fileUrl, fileType, fileName);
    if (result?.error) {
      toast({
        title: 'Failed to send message',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSendGroupMessage = async (
    message: string,
    fileUrl?: string,
    fileType?: string,
    fileName?: string
  ) => {
    const result = await sendGroupMessage(message, fileUrl, fileType, fileName);
    if (result?.error) {
      toast({
        title: 'Failed to send message',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been logged out successfully.'
    });
  };

  if (!profile) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatHeader 
        profile={profile} 
        onSignOut={handleSignOut}
        isAdmin={isAdmin}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 shrink-0 hidden md:block">
          <UserList
            users={users}
            groups={groups}
            selectedUserId={selectedUserId}
            selectedGroupId={selectedGroupId}
            onSelectUser={handleSelectUser}
            onSelectGroup={handleSelectGroup}
            currentUserId={user?.id || ''}
            lastMessages={lastMessages}
            groupLastMessages={groupLastMessages}
            onCreateGroup={createGroup}
          />
        </div>
        {selectedGroupId && selectedGroup ? (
          <GroupChatArea
            group={selectedGroup}
            members={groupMembers[selectedGroupId] || []}
            messages={groupMessages}
            currentUserId={user?.id || ''}
            users={users}
            onSendMessage={handleSendGroupMessage}
          />
        ) : (
          <ChatArea
            selectedUser={selectedUser}
            messages={messages}
            currentUserId={user?.id || ''}
            isTyping={isUserTyping}
            onSendMessage={handleSendMessage}
            onTyping={setTyping}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;
