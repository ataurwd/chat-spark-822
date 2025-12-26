import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Profile } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = (
  currentUserId: string | undefined,
  selectedUserId: string | null,
  users: Profile[]
) => {
  const { toast } = useToast();
  const permissionRef = useRef<NotificationPermission>('default');

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        permissionRef.current = permission;
      });
    }
  }, []);

  // Subscribe to incoming messages for notifications
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('notification-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Only notify if we're the receiver and not viewing that conversation
          if (newMessage.receiver_id === currentUserId && newMessage.sender_id !== selectedUserId) {
            const sender = users.find(u => u.user_id === newMessage.sender_id);
            const senderName = sender?.name || 'Someone';
            
            // Show toast notification
            toast({
              title: senderName,
              description: newMessage.message.length > 50 
                ? newMessage.message.slice(0, 50) + '...' 
                : newMessage.message,
            });

            // Show browser notification if permitted
            if (permissionRef.current === 'granted' && document.hidden) {
              new Notification(senderName, {
                body: newMessage.message,
                icon: ''
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedUserId, users, toast]);
};
