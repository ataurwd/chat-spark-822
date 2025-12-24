import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const isGif = message.file_type === 'gif';
  const isImage = message.file_type === 'image';
  const isFile = message.file_type === 'file';
  const hasMedia = message.file_url && (isGif || isImage || isFile);

  return (
    <div
      className={cn(
        "flex w-full mb-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl shadow-sm overflow-hidden",
          hasMedia && !isFile ? "p-0" : "px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-card-foreground border border-border rounded-bl-md"
        )}
      >
        {/* GIF or Image */}
        {(isGif || isImage) && message.file_url && (
          <img
            src={message.file_url}
            alt={isGif ? "GIF" : "Image"}
            className="max-w-full rounded-t-2xl"
            loading="lazy"
          />
        )}

        {/* File attachment */}
        {isFile && message.file_url && (
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg hover:opacity-80 transition-opacity",
              isOwn ? "bg-primary-foreground/10" : "bg-muted"
            )}
          >
            <FileText className="h-8 w-8 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.file_name || 'File'}</p>
              <p className={cn(
                "text-xs",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                Click to download
              </p>
            </div>
            <Download className="h-4 w-4 shrink-0" />
          </a>
        )}

        {/* Text message */}
        {message.message && (
          <div className={cn(hasMedia && !isFile && "px-4 py-2")}>
            <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
          </div>
        )}

        {/* Timestamp and status */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            hasMedia && !isFile && "px-4 pb-2",
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
