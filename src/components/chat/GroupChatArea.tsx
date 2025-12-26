import { useEffect, useRef } from 'react';
import { Group, GroupMember, Message, Profile } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { MessageSquare, Users } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface GroupChatAreaProps {
  group: Group;
  members: GroupMember[];
  messages: Message[];
  currentUserId: string;
  users: Profile[];
  onSendMessage: (message: string, fileUrl?: string, fileType?: string, fileName?: string) => Promise<void>;
  onEditMessage: (messageId: string, newMessage: string) => Promise<{ error: unknown } | undefined>;
  onDeleteMessage: (messageId: string) => Promise<{ error: unknown } | undefined>;
}

export const GroupChatArea = ({
  group,
  members,
  messages,
  currentUserId,
  users,
  onSendMessage,
  onEditMessage,
  onDeleteMessage
}: GroupChatAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { uploadFile, uploading } = useFileUpload(currentUserId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.name || 'Unknown';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Group Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
          <Users className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground">{group.name}</h3>
          <p className="text-xs text-muted-foreground">
            {members.length} members
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-1">
          {messages.map(message => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div key={message.id}>
                {!isOwn && (
                  <p className="text-xs text-muted-foreground ml-2 mb-0.5">
                    {getUserName(message.sender_id)}
                  </p>
                )}
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput
        onSend={onSendMessage}
        onTyping={() => {}}
        onFileSelect={uploadFile}
        uploading={uploading}
      />
    </div>
  );
};
