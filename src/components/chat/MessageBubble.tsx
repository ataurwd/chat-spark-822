import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        "flex w-full mb-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-card-foreground border border-border rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <span
            className={cn(
              "text-[10px]",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {isOwn && (
            message.seen ? (
              <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />
            ) : (
              <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
};
