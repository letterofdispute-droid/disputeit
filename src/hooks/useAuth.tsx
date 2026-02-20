import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { processOAuthToken } from '@/lib/oauthTokenHandler';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  profile: Profile | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  linkGoogle: () => Promise<{ error: Error | null }>;
  unlinkIdentity: (identityId: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin, first_name, last_name, avatar_url')
          .eq('user_id', userId)
          .single();
        
        if (isMounted && data) {
          setIsAdmin(data.is_admin ?? false);
          setProfile({
            first_name: data.first_name,
            last_name: data.last_name,
            avatar_url: data.avatar_url,
          });
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
          setProfile(null);
        }
      }
    };

    const initializeAuth = async () => {
      // Safety timeout: if auth initialization hangs (e.g. network issues), stop loading after 8s
      const safetyTimeout = setTimeout(() => {
        if (isMounted) {
          console.warn('[Auth] Initialization timed out - setting isLoading=false');
          setIsLoading(false);
        }
      }, 8000);

      try {
        // STEP 1: Process OAuth token if present in URL
        const oauthResult = await processOAuthToken();
        
        // If OAuth was processed, give a moment for session to propagate
        if (oauthResult.processed) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // STEP 2: Get the session (may have been set by OAuth processing)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.warn('[Auth] Initialization error:', err);
      } finally {
        clearTimeout(safetyTimeout);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);

          // Sync Google avatar if user just linked Google and has no avatar
          if (event === 'USER_UPDATED') {
            const googleIdentity = session.user.identities?.find(i => i.provider === 'google');
            const googleAvatar = googleIdentity?.identity_data?.avatar_url || googleIdentity?.identity_data?.picture;
            if (googleAvatar) {
              setTimeout(async () => {
                const { data: prof } = await supabase
                  .from('profiles')
                  .select('avatar_url')
                  .eq('user_id', session.user.id)
                  .single();
                if (prof && !prof.avatar_url) {
                  await supabase
                    .from('profiles')
                    .update({ avatar_url: googleAvatar })
                    .eq('user_id', session.user.id);
                  if (isMounted) {
                    setProfile(prev => prev ? { ...prev, avatar_url: googleAvatar } : prev);
                  }
                }
              }, 0);
            }
          }
        } else {
          setIsAdmin(false);
          setProfile(null);
        }
      }
    );

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Clear state FIRST for instant UI update
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setProfile(null);
    // Then sign out from Supabase
    await supabase.auth.signOut();
  };

  const linkGoogle = async () => {
    // Store flag so we know a link attempt is in progress when we return
    sessionStorage.setItem('linking_google', 'true');

    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/settings`,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      sessionStorage.removeItem('linking_google');
      return { error };
    }
    // Redirect manually so we control the return URL
    if (data?.url) {
      window.location.href = data.url;
    }
    return { error: null };
  };

  const unlinkIdentity = async (identityId: string) => {
    const { error } = await supabase.auth.unlinkIdentity({
      id: identityId,
    } as any);
    if (!error) {
      // Refresh user data
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    }
    return { error: error || null };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      isAdmin,
      profile,
      signUp, 
      signIn, 
      signOut,
      linkGoogle,
      unlinkIdentity,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
