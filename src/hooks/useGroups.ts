import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Group, GroupMember } from '@/types/chat';

export const useGroups = (userId: string | undefined) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMember[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setGroups(data as Group[]);
    }
    setLoading(false);
  }, [userId]);

  const fetchGroupMembers = useCallback(async (groupId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);

    if (data && !error) {
      setGroupMembers(prev => ({ ...prev, [groupId]: data as GroupMember[] }));
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    groups.forEach(group => {
      fetchGroupMembers(group.id);
    });
  }, [groups, fetchGroupMembers]);

  // Subscribe to group changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groups' },
        () => fetchGroups()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members' },
        (payload) => {
          const groupId = (payload.new as GroupMember)?.group_id || (payload.old as GroupMember)?.group_id;
          if (groupId) {
            fetchGroupMembers(groupId);
          }
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchGroups, fetchGroupMembers]);

  const createGroup = async (name: string, memberIds: string[]) => {
    if (!userId) return { error: new Error('Not authenticated') };

    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name, created_by: userId })
      .select()
      .single();

    if (groupError || !group) {
      return { error: groupError };
    }

    // Add creator as member
    await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId });

    // Add other members
    const memberInserts = memberIds
      .filter(id => id !== userId)
      .map(id => ({ group_id: group.id, user_id: id }));

    if (memberInserts.length > 0) {
      await supabase.from('group_members').insert(memberInserts);
    }

    return { data: group, error: null };
  };

  const addMember = async (groupId: string, memberId: string) => {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: memberId });

    return { error };
  };

  return { groups, groupMembers, loading, createGroup, addMember, fetchGroups };
};
