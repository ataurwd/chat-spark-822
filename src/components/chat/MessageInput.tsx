import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Paperclip, Image, Loader2 } from 'lucide-react';
import { GifPicker } from './GifPicker';

interface MessageInputProps {
  onSend: (message: string, fileUrl?: string, fileType?: string, fileName?: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onFileSelect: (file: File) => Promise<{ url: string; type: string; name: string } | null>;
  uploading?: boolean;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, onTyping, onFileSelect, uploading, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!message.trim() || sending || disabled) return;

    setSending(true);
    onTyping(false);
    await onSend(message);
    setMessage('');
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await onFileSelect(file);
    if (result) {
      await onSend('', result.url, result.type, result.name);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGifSelect = async (gifUrl: string) => {
    setGifOpen(false);
    await onSend('', gifUrl, 'gif', 'GIF');
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="flex items-end gap-2 p-4 bg-card border-t border-border">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="h-11 w-11 shrink-0"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </Button>

      <Popover open={gifOpen} onOpenChange={setGifOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="h-11 w-11 shrink-0"
          >
            <Image className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto" align="start">
          <GifPicker onSelect={handleGifSelect} />
        </PopoverContent>
      </Popover>

      <Textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        className="min-h-[44px] max-h-[120px] resize-none bg-background border-input"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!message.trim() || sending || disabled}
        size="icon"
        className="h-11 w-11 shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};
