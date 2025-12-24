import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string | null;
  created_at: string;
}

export const useReports = (currentUserId: string | undefined) => {
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [myReports, setMyReports] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    
    // Fetch all reports to count them per user
    const { data: allReports, error } = await supabase
      .from('user_reports')
      .select('*');

    if (allReports && !error) {
      // Count reports per user
      const counts: Record<string, number> = {};
      const myReportSet = new Set<string>();

      allReports.forEach((report: UserReport) => {
        counts[report.reported_user_id] = (counts[report.reported_user_id] || 0) + 1;
        if (report.reporter_id === currentUserId) {
          myReportSet.add(report.reported_user_id);
        }
      });

      setReportCounts(counts);
      setMyReports(myReportSet);
    }
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Subscribe to report changes
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('user-reports-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_reports'
        },
        (payload) => {
          const newReport = payload.new as UserReport;
          setReportCounts(prev => ({
            ...prev,
            [newReport.reported_user_id]: (prev[newReport.reported_user_id] || 0) + 1
          }));
          if (newReport.reporter_id === currentUserId) {
            setMyReports(prev => new Set([...prev, newReport.reported_user_id]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const reportUser = async (userId: string, reason?: string) => {
    if (!currentUserId || currentUserId === userId) return { error: new Error('Cannot report yourself') };

    const { error } = await supabase.from('user_reports').insert({
      reporter_id: currentUserId,
      reported_user_id: userId,
      reason: reason || null,
    });

    return { error };
  };

  const getReportCount = (userId: string) => reportCounts[userId] || 0;
  
  const isUserBlocked = (userId: string) => getReportCount(userId) >= 3;
  
  const hasReportedUser = (userId: string) => myReports.has(userId);

  return { 
    reportUser, 
    getReportCount, 
    isUserBlocked, 
    hasReportedUser,
    loading 
  };
};
