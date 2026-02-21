import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TrailingSlashRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname !== '/' && pathname.endsWith('/')) {
      navigate(pathname.replace(/\/+$/, '') + search + hash, { replace: true });
    }
  }, [pathname, search, hash, navigate]);

  return null;
};

export default TrailingSlashRedirect;
