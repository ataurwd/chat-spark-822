import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, onTyping, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="flex items-end gap-2 p-4 bg-card border-t border-border">
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
