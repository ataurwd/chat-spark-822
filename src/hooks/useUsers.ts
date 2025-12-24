import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/chat';

export const useUsers = (currentUserId: string | undefined) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', currentUserId)
        .order('name');

      if (data && !error) {
        setUsers(data as Profile[]);
      }
      setLoading(false);
    };

    fetchUsers();

    // Subscribe to profile changes for online status updates
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedProfile = payload.new as Profile;
            if (updatedProfile.user_id !== currentUserId) {
              setUsers(prev => 
                prev.map(user => 
                  user.user_id === updatedProfile.user_id ? updatedProfile : user
                )
              );
            }
          } else if (payload.eventType === 'INSERT') {
            const newProfile = payload.new as Profile;
            if (newProfile.user_id !== currentUserId) {
              setUsers(prev => [...prev, newProfile]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return { users, loading };
};
