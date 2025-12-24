export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <div className="flex gap-1">
        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-muted-foreground ml-2">typing...</span>
    </div>
  );
};
