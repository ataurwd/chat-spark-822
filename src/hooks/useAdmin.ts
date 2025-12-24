import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdmin = (userId: string | undefined) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkAdminRole = async () => {
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin' });

      if (!error && data) {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    checkAdminRole();
  }, [userId]);

  const blockUser = async (targetUserId: string) => {
    const { error } = await supabase.rpc('admin_block_user', { _user_id: targetUserId });
    return { error };
  };

  const unblockUser = async (targetUserId: string) => {
    const { error } = await supabase.rpc('admin_unblock_user', { _user_id: targetUserId });
    return { error };
  };

  const sendNotification = async (targetUserId: string, title: string, message: string) => {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        title,
        message
      });
    return { error };
  };

  return { isAdmin, loading, blockUser, unblockUser, sendNotification };
};
