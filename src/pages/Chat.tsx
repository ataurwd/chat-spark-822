import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useMessages } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useLastMessages } from '@/hooks/useLastMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { UserList } from '@/components/chat/UserList';
import { ChatArea } from '@/components/chat/ChatArea';
import { useToast } from '@/hooks/use-toast';

const Chat = () => {
  const { user, profile, signOut } = useAuth();
  const { users } = useUsers(user?.id);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { messages, sendMessage } = useMessages(user?.id, selectedUserId);
  const { isUserTyping, setTyping } = useTypingIndicator(user?.id, selectedUserId);
  const { lastMessages } = useLastMessages(user?.id);
  const { toast } = useToast();
  
  // Enable notifications
  useNotifications(user?.id, selectedUserId, users);

  const selectedUser = users.find(u => u.user_id === selectedUserId) || null;

  const handleSendMessage = async (message: string) => {
    const result = await sendMessage(message);
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
      <ChatHeader profile={profile} onSignOut={handleSignOut} />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 shrink-0 hidden md:block">
          <UserList
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            currentUserId={user?.id || ''}
            lastMessages={lastMessages}
          />
        </div>
        <ChatArea
          selectedUser={selectedUser}
          messages={messages}
          currentUserId={user?.id || ''}
          isTyping={isUserTyping}
          onSendMessage={handleSendMessage}
          onTyping={setTyping}
        />
      </div>
    </div>
  );
};

export default Chat;
