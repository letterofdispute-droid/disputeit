import { Link } from 'react-router-dom';
import { LetterTemplate } from '@/data/letterTemplates';
import { getTemplatesByCategory, getCategoryIdFromName } from '@/data/allTemplates';
import { inferSubcategory } from '@/data/subcategoryMappings';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RelatedTemplatesProps {
  currentTemplate: LetterTemplate;
  categoryId: string;
  subcategorySlug: string;
  maxItems?: number;
}

const RelatedTemplates = ({ 
  currentTemplate, 
  categoryId, 
  subcategorySlug,
  maxItems = 6 
}: RelatedTemplatesProps) => {
  // Get all templates in the same category
  const categoryTemplates = getTemplatesByCategory(categoryId);
  
  // Prioritize templates from the same subcategory
  const sameSubcategory = categoryTemplates.filter(t => {
    if (t.slug === currentTemplate.slug) return false;
    const sub = inferSubcategory(t.id, t.category);
    return sub?.slug === subcategorySlug;
  });

  // Then add templates from other subcategories
  const otherSubcategories = categoryTemplates.filter(t => {
    if (t.slug === currentTemplate.slug) return false;
    const sub = inferSubcategory(t.id, t.category);
    return sub?.slug !== subcategorySlug;
  });

  // Combine: same subcategory first, then others
  const relatedTemplates = [...sameSubcategory, ...otherSubcategories].slice(0, maxItems);

  if (relatedTemplates.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-secondary/30 border-t border-border">
      <div className="container-wide">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-2">
            Related Letter Templates
          </h2>
          <p className="text-muted-foreground">
            You might also need one of these for your situation
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatedTemplates.map(template => {
            const subcategory = inferSubcategory(template.id, template.category);
            const templateSubcategorySlug = subcategory?.slug || 'general';
            const isSameSubcategory = templateSubcategorySlug === subcategorySlug;

            return (
              <Link
                key={template.slug}
                to={`/templates/${categoryId}/${templateSubcategorySlug}/${template.slug}`}
                className="group p-4 bg-background rounded-lg border border-border hover:border-accent hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
                    {template.title}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent shrink-0 mt-1 transition-colors" />
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {template.shortDescription}
                </p>

                <div className="flex items-center gap-2">
                  {isSameSubcategory ? (
                    <Badge variant="secondary" className="text-xs">
                      Same category
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {subcategory?.name || 'General'}
                    </Badge>
                  )}
                  {template.tones && (
                    <span className="text-xs text-muted-foreground">
                      {template.tones.length} tone{template.tones.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Link to full category */}
        <div className="text-center mt-8">
          <Link
            to={`/templates/${categoryId}`}
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
          >
            View all templates in this category
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RelatedTemplates;
