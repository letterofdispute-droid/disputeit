import { allTemplates, getCategoryIdFromName } from './data/allTemplates';
import { templateCategories } from './data/templateCategories';
import { inferSubcategory, getSubcategoriesForCategory } from './data/subcategoryMappings';

// Build unique subcategory routes
const getSubcategoryRoutes = (): string[] => {
  const routes: Set<string> = new Set();
  
  templateCategories.forEach(category => {
    const subcategories = getSubcategoriesForCategory(category.name);
    subcategories.forEach(sub => {
      routes.add(`/templates/${category.id}/${sub.slug}`);
    });
  });
  
  return Array.from(routes);
};

// Build template routes with hierarchical structure
const getTemplateRoutes = (): string[] => {
  return allTemplates.map(template => {
    const categoryId = getCategoryIdFromName(template.category);
    const subcategoryInfo = inferSubcategory(template.id, template.category);
    const subcategorySlug = subcategoryInfo?.slug || 'general';
    return `/templates/${categoryId}/${subcategorySlug}/${template.slug}`;
  });
};

// Generate all routes for static pre-rendering
export const routes = [
  '/',
  '/templates',
  '/how-it-works',
  '/pricing',
  '/faq',
  '/about',
  '/contact',
  '/terms',
  ...templateCategories.map(c => `/templates/${c.id}`),
  ...getSubcategoryRoutes(),
  ...getTemplateRoutes(),
];

export default routes;
