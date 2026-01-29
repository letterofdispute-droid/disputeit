import { useParams, Navigate } from 'react-router-dom';
import { getTemplateBySlug, getCategoryIdFromName } from '@/data/allTemplates';
import { inferSubcategory } from '@/data/subcategoryMappings';

/**
 * Handles legacy /complaint-letter/:slug URLs and redirects to the new
 * hierarchical /templates/:category/:subcategory/:slug URLs
 */
const LegacyTemplateRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const template = slug ? getTemplateBySlug(slug) : undefined;

  if (!template) {
    return <Navigate to="/404" replace />;
  }

  const categoryId = getCategoryIdFromName(template.category);
  const subcategoryInfo = inferSubcategory(template.id, template.category);
  const subcategorySlug = subcategoryInfo?.slug || 'general';

  // Redirect to new hierarchical URL
  return <Navigate to={`/templates/${categoryId}/${subcategorySlug}/${template.slug}`} replace />;
};

export default LegacyTemplateRedirect;
