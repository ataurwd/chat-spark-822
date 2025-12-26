import { useState } from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, FileText, Download, MoreVertical, Pencil, Trash2, X, Check as CheckIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onEdit?: (messageId: string, newMessage: string) => Promise<{ error: unknown } | undefined>;
  onDelete?: (messageId: string) => Promise<{ error: unknown } | undefined>;
}

export const MessageBubble = ({ message, isOwn, onEdit, onDelete }: MessageBubbleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message.message);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isGif = message.file_type === 'gif';
  const isImage = message.file_type === 'image';
  const isFile = message.file_type === 'file';
  const hasMedia = message.file_url && (isGif || isImage || isFile);

  const handleEdit = async () => {
    if (!onEdit || !editedMessage.trim()) return;
    setIsLoading(true);
    const result = await onEdit(message.id, editedMessage);
    setIsLoading(false);
    if (!result?.error) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsLoading(true);
    await onDelete(message.id);
    setIsLoading(false);
    setShowDeleteDialog(false);
  };

  const handleCancelEdit = () => {
    setEditedMessage(message.message);
    setIsEditing(false);
  };

  return (
    <>
      <div
        className={cn(
          "flex w-full mb-2 group",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* Actions dropdown - only show for own messages */}
        {isOwn && !isEditing && (
          <div className="flex items-center mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {message.message && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

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

          {/* Text message - editable or display */}
          {message.message && (
            <div className={cn(hasMedia && !isFile && "px-4 py-2")}>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    className="text-sm bg-background text-foreground"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 shrink-0"
                    onClick={handleEdit}
                    disabled={isLoading}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 shrink-0"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
              )}
            </div>
          )}

          {/* Timestamp and status */}
          {!isEditing && (
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
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
