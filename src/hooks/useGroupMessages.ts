import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

export const useGroupMessages = (userId: string | undefined, groupId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!userId || !groupId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (data && !error) {
      setMessages(data as Message[]);
    }
    setLoading(false);
  }, [userId, groupId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!userId || !groupId) return;

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, groupId]);

  const sendMessage = async (
    message: string,
    fileUrl?: string,
    fileType?: string,
    fileName?: string
  ) => {
    if (!userId || !groupId) return;
    if (!message.trim() && !fileUrl) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: null,
      group_id: groupId,
      message: message.trim(),
      file_url: fileUrl || null,
      file_type: fileType || null,
      file_name: fileName || null,
    });

    return { error };
  };

  const editMessage = async (messageId: string, newMessage: string) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('messages')
      .update({ message: newMessage.trim() })
      .eq('id', messageId)
      .eq('sender_id', userId);

    return { error };
  };

  const deleteMessage = async (messageId: string) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId);

    if (!error) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }

    return { error };
  };

  return { messages, loading, sendMessage, editMessage, deleteMessage };
};
