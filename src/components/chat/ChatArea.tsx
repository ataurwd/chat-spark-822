import { useEffect, useRef } from 'react';
import { Profile, Message } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatAreaProps {
  selectedUser: Profile | null;
  messages: Message[];
  currentUserId: string;
  isTyping: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}

export const ChatArea = ({
  selectedUser,
  messages,
  currentUserId,
  isTyping,
  onSendMessage,
  onTyping
}: ChatAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-10 w-10 text-accent-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Welcome to ChatFlow
          </h3>
          <p className="text-muted-foreground max-w-sm">
            Select a conversation from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <div className="relative">
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              {getInitials(selectedUser.name)}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
              selectedUser.is_online ? "bg-green-500" : "bg-muted"
            )}
          />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground">{selectedUser.name}</h3>
          <p className="text-xs text-muted-foreground">
            {selectedUser.is_online ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-1">
          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === currentUserId}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput onSend={onSendMessage} onTyping={onTyping} />
    </div>
  );
};
