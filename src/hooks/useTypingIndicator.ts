import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TypingStatus } from '@/types/chat';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresencePayload {
  user_id: string;
  typing: boolean;
  presence_ref?: string;
}

export const useTypingIndicator = (currentUserId: string | undefined, selectedUserId: string | null) => {
  const [typingUsers, setTypingUsers] = useState<TypingStatus>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to presence for typing indicators
  useEffect(() => {
    if (!currentUserId || !selectedUserId) return;

    const channelName = `typing:${[currentUserId, selectedUserId].sort().join('-')}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newTypingStatus: TypingStatus = {};
        
        Object.keys(state).forEach(key => {
          const presences = state[key] as unknown as PresencePayload[];
          presences.forEach(presence => {
            if (presence.user_id && presence.user_id !== currentUserId && presence.typing) {
              newTypingStatus[presence.user_id] = true;
            }
          });
        });
        
        setTypingUsers(newTypingStatus);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, typing: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentUserId, selectedUserId]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!currentUserId || !selectedUserId || !channelRef.current) return;

    await channelRef.current.track({ user_id: currentUserId, typing: isTyping });

    // Clear typing after 3 seconds of inactivity
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({ user_id: currentUserId, typing: false });
        }
      }, 3000);
    }
  }, [currentUserId, selectedUserId]);

  const isUserTyping = selectedUserId ? typingUsers[selectedUserId] : false;

  return { isUserTyping, setTyping };
};
