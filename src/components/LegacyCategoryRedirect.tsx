import { useParams, Navigate } from 'react-router-dom';

/**
 * Handles legacy /category/:categoryId URLs and redirects to the new
 * /templates/:categoryId URLs
 */
const LegacyCategoryRedirect = () => {
  const { categoryId } = useParams<{ categoryId: string }>();

  if (!categoryId) {
    return <Navigate to="/templates" replace />;
  }

  // Redirect to new URL structure
  return <Navigate to={`/templates/${categoryId}`} replace />;
};

export default LegacyCategoryRedirect;
