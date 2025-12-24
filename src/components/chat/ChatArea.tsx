import { useEffect, useRef } from 'react';
import { Profile, Message } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ReportUserDialog } from './ReportUserDialog';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Badge } from '@/components/ui/badge';

interface ChatAreaProps {
  selectedUser: Profile | null;
  messages: Message[];
  currentUserId: string;
  isTyping: boolean;
  onSendMessage: (message: string, fileUrl?: string, fileType?: string, fileName?: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  reportUser: (userId: string, reason?: string) => Promise<{ error: Error | null }>;
  getReportCount: (userId: string) => number;
  isUserBlocked: (userId: string) => boolean;
  hasReportedUser: (userId: string) => boolean;
}

export const ChatArea = ({
  selectedUser,
  messages,
  currentUserId,
  isTyping,
  onSendMessage,
  onTyping,
  reportUser,
  getReportCount,
  isUserBlocked,
  hasReportedUser
}: ChatAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { uploadFile, uploading } = useFileUpload(currentUserId);

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

  const reportCount = selectedUser ? getReportCount(selectedUser.user_id) : 0;
  const blocked = selectedUser ? isUserBlocked(selectedUser.user_id) : false;

  // Determine badge color based on report count
  const getBadgeVariant = () => {
    if (reportCount >= 3) return 'destructive';
    if (reportCount >= 2) return 'destructive';
    if (reportCount >= 1) return 'secondary';
    return 'secondary';
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className={cn(
              "h-10 w-10 border-2",
              reportCount >= 3 ? "border-destructive" : reportCount >= 2 ? "border-orange-500" : reportCount >= 1 ? "border-yellow-500" : "border-border"
            )}>
              <AvatarFallback className={cn(
                "font-medium",
                reportCount >= 3 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
              )}>
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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-card-foreground">{selectedUser.name}</h3>
              {reportCount > 0 && (
                <Badge variant={getBadgeVariant()} className="text-xs">
                  {reportCount} report{reportCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {blocked ? 'Blocked' : selectedUser.is_online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <ReportUserDialog
          userName={selectedUser.name}
          onReport={(reason) => reportUser(selectedUser.user_id, reason)}
          hasReported={hasReportedUser(selectedUser.user_id)}
        />
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
      {blocked ? (
        <div className="p-4 border-t border-border bg-destructive/10">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-sm font-medium">This user is blocked due to multiple reports</span>
          </div>
        </div>
      ) : (
        <MessageInput
          onSend={onSendMessage}
          onTyping={onTyping}
          onFileSelect={uploadFile}
          uploading={uploading}
        />
      )}
    </div>
  );
};
