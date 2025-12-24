import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

export const useLastMessages = (currentUserId: string | undefined) => {
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [groupLastMessages, setGroupLastMessages] = useState<Record<string, Message>>({});

  const fetchLastMessages = useCallback(async () => {
    if (!currentUserId) return;

    // Fetch last messages for direct conversations
    const { data: directMessages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .is('group_id', null)
      .order('created_at', { ascending: false });

    if (directMessages) {
      const messageMap: Record<string, Message> = {};
      directMessages.forEach((msg: Message) => {
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        if (otherUserId && !messageMap[otherUserId]) {
          messageMap[otherUserId] = msg;
        }
      });
      setLastMessages(messageMap);
    }

    // Fetch last messages for groups
    const { data: groupMessages } = await supabase
      .from('messages')
      .select('*')
      .not('group_id', 'is', null)
      .order('created_at', { ascending: false });

    if (groupMessages) {
      const groupMessageMap: Record<string, Message> = {};
      groupMessages.forEach((msg: Message) => {
        if (msg.group_id && !groupMessageMap[msg.group_id]) {
          groupMessageMap[msg.group_id] = msg;
        }
      });
      setGroupLastMessages(groupMessageMap);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchLastMessages();
  }, [fetchLastMessages]);

  // Subscribe to message changes
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('last-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchLastMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchLastMessages]);

  return { lastMessages, groupLastMessages };
};
