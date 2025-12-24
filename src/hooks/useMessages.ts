import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

export const useMessages = (currentUserId: string | undefined, selectedUserId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!currentUserId || !selectedUserId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (data && !error) {
      setMessages(data as Message[]);
    }
    setLoading(false);
  }, [currentUserId, selectedUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Mark messages as seen when they're loaded
  useEffect(() => {
    if (!currentUserId || !selectedUserId) return;

    const markAsSeen = async () => {
      await supabase
        .from('messages')
        .update({ seen: true })
        .eq('sender_id', selectedUserId)
        .eq('receiver_id', currentUserId)
        .eq('seen', false);
    };

    markAsSeen();
  }, [currentUserId, selectedUserId, messages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!currentUserId || !selectedUserId) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if it's part of current conversation
          if (
            (newMessage.sender_id === currentUserId && newMessage.receiver_id === selectedUserId) ||
            (newMessage.sender_id === selectedUserId && newMessage.receiver_id === currentUserId)
          ) {
            setMessages(prev => [...prev, newMessage]);
            
            // Mark as seen if we're the receiver
            if (newMessage.receiver_id === currentUserId) {
              supabase
                .from('messages')
                .update({ seen: true })
                .eq('id', newMessage.id);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev =>
            prev.map(msg => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedUserId]);

  const sendMessage = async (message: string) => {
    if (!currentUserId || !selectedUserId || !message.trim()) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: selectedUserId,
      message: message.trim()
    });

    return { error };
  };

  return { messages, loading, sendMessage };
};
