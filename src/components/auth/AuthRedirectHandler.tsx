import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AuthRedirectHandler = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    // Check if we just came back from OAuth (flag set before redirect OR token was processed)
    const oauthPending = sessionStorage.getItem('oauth_pending');
    const justProcessedOAuth = sessionStorage.getItem('oauth_just_processed');
    
    // If user is logged in and on home page after OAuth
    if (user && location.pathname === '/' && (oauthPending || justProcessedOAuth)) {
      hasRedirected.current = true;
      sessionStorage.removeItem('oauth_pending');
      sessionStorage.removeItem('oauth_just_processed');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, location.pathname, navigate]);

  return null;
};

export default AuthRedirectHandler;
