import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserCredit {
  id: string;
  user_id: string;
  // granted_by intentionally omitted from user-facing queries to prevent admin UUID exposure
  granted_at: string;
  expires_at: string;
  used_at: string | null;
  purchase_id: string | null;
  reason: string | null;
  status: 'active' | 'used' | 'expired';
}

interface UseUserCreditsOptions {
  userId?: string; // For admin viewing other users
}

export const useUserCredits = (options: UseUserCreditsOptions = {}) => {
  const { user, isAdmin } = useAuth();
  const [credits, setCredits] = useState<UserCredit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = options.userId || user?.id;

  const fetchCredits = useCallback(async () => {
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_credits')
        .select('id, user_id, granted_at, expires_at, used_at, purchase_id, reason, status')
        .eq('user_id', targetUserId)
        .order('granted_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Cast the data to proper type
      setCredits((data as UserCredit[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
      setCredits([]);
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Get only active (non-expired, non-used) credits
  const activeCredits = credits.filter(
    (credit) =>
      credit.status === 'active' &&
      new Date(credit.expires_at) > new Date()
  );

  // Check if user can receive more credits (max 2)
  const canReceiveCredit = activeCredits.length < 2;

  // Get the oldest active credit (for redemption)
  const oldestActiveCredit = activeCredits.sort(
    (a, b) => new Date(a.granted_at).getTime() - new Date(b.granted_at).getTime()
  )[0];

  // Grant a credit to a user (admin only)
  const grantCredit = async (targetUserId: string, reason?: string, targetUserEmail?: string) => {
    if (!user?.id || !isAdmin) {
      throw new Error('Only admins can grant credits');
    }

    const { data: insertedCredit, error: insertError } = await supabase
      .from('user_credits')
      .insert({
        user_id: targetUserId,
        granted_by: user.id,
        reason: reason || null,
      })
      .select()
      .single();

    if (insertError) {
      // Check for the max credit limit error
      if (insertError.message.includes('more than 2 active credits')) {
        throw new Error('User already has the maximum of 2 active credits');
      }
      throw insertError;
    }

    // Send email notification if we have the user's email
    if (targetUserEmail && insertedCredit) {
      try {
        await supabase.functions.invoke('send-credit-email', {
          body: {
            email: targetUserEmail,
            reason: reason || undefined,
            expiresAt: insertedCredit.expires_at,
          },
        });
        console.log('Credit notification email sent to:', targetUserEmail);
      } catch (emailError) {
        // Don't fail the credit grant if email fails
        console.error('Failed to send credit notification email:', emailError);
      }
    }

    // Refresh credits
    await fetchCredits();
  };

  return {
    credits,
    activeCredits,
    activeCount: activeCredits.length,
    canReceiveCredit,
    oldestActiveCredit,
    isLoading,
    error,
    refetch: fetchCredits,
    grantCredit,
  };
};

// Hook for fetching credit counts for multiple users (admin use)
export const useUsersCreditCounts = (userIds: string[]) => {
  const [creditCounts, setCreditCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      if (userIds.length === 0) {
        setCreditCounts({});
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_credits')
          .select('user_id, status, expires_at')
          .in('user_id', userIds)
          .eq('status', 'active');

        if (error) throw error;

        // Count active (non-expired) credits per user
        const counts: Record<string, number> = {};
        const now = new Date();
        
        (data || []).forEach((credit) => {
          if (new Date(credit.expires_at) > now) {
            counts[credit.user_id] = (counts[credit.user_id] || 0) + 1;
          }
        });

        setCreditCounts(counts);
      } catch (err) {
        console.error('Failed to fetch credit counts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [userIds.join(',')]);

  return { creditCounts, isLoading };
};
