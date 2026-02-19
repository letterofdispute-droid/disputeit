import { allTemplates, getCategoryIdFromName } from './data/allTemplates';
import { templateCategories } from './data/templateCategories';
import { inferSubcategory, getSubcategoriesForCategory } from './data/subcategoryMappings';
import { US_STATES, CATEGORY_LABELS, getStateSlug } from './data/stateSpecificLaws';

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

// Build state rights routes — 51 state hubs + 663 state+category pages
const getStateRightsRoutes = (): string[] => {
  const routes: string[] = [];
  // State hub pages (one per state/DC)
  US_STATES.forEach(s => {
    routes.push(`/state-rights/${getStateSlug(s.code)}`);
  });
  // State + category pages (51 states × 13 categories)
  US_STATES.forEach(s => {
    Object.keys(CATEGORY_LABELS).forEach(cat => {
      routes.push(`/state-rights/${getStateSlug(s.code)}/${cat}`);
    });
  });
  return routes;
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
  '/privacy',
  '/disclaimer',
  '/guides',
  '/state-rights',
  '/deadlines',
  '/consumer-news',
  '/analyze-letter',
  ...templateCategories.map(c => `/guides/${c.id}`),
  ...templateCategories.map(c => `/templates/${c.id}`),
  ...getSubcategoryRoutes(),
  ...getTemplateRoutes(),
  ...getStateRightsRoutes(),
];

export default routes;
