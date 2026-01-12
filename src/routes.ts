import { allTemplates } from './data/allTemplates';
import { templateCategories } from './data/templateCategories';

// Generate all routes for static pre-rendering
export const routes = [
  '/',
  ...templateCategories.map(c => `/category/${c.id}`),
  ...allTemplates.map(t => `/complaint-letter/${t.slug}`),
];

export default routes;
