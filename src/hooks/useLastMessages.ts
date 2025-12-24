import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

export const useLastMessages = (currentUserId: string | undefined) => {
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});

  useEffect(() => {
    if (!currentUserId) return;

    const fetchLastMessages = async () => {
      // Get all messages where user is sender or receiver
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (data && !error) {
        const messageMap: Record<string, Message> = {};
        
        data.forEach(msg => {
          const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
          // Only keep the most recent message for each conversation
          if (!messageMap[otherUserId]) {
            messageMap[otherUserId] = msg as Message;
          }
        });
        
        setLastMessages(messageMap);
      }
    };

    fetchLastMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('last-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === currentUserId || newMessage.receiver_id === currentUserId) {
            const otherUserId = newMessage.sender_id === currentUserId 
              ? newMessage.receiver_id 
              : newMessage.sender_id;
            
            setLastMessages(prev => ({
              ...prev,
              [otherUserId]: newMessage
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return { lastMessages };
};

