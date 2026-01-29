import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LetterTemplate } from '@/data/letterTemplates';
import { SubcategoryInfo } from '@/data/subcategoryMappings';
import { getCategoryIdFromName } from '@/data/allTemplates';
import { inferSubcategory } from '@/data/subcategoryMappings';

interface TemplateCardProps {
  template: LetterTemplate;
  subcategoryInfo?: SubcategoryInfo | null;
  showSubcategory?: boolean;
  // Optional overrides for URL construction (used when already on category/subcategory pages)
  categoryId?: string;
  subcategorySlug?: string;
}

const TemplateCard = ({ 
  template, 
  subcategoryInfo, 
  showSubcategory = true,
  categoryId,
  subcategorySlug 
}: TemplateCardProps) => {
  // Build the hierarchical URL
  const buildTemplateUrl = () => {
    const catId = categoryId || getCategoryIdFromName(template.category);
    const subSlug = subcategorySlug || subcategoryInfo?.slug || inferSubcategory(template.id, template.category)?.slug || 'general';
    return `/templates/${catId}/${subSlug}/${template.slug}`;
  };

  return (
    <Link
      to={buildTemplateUrl()}
      className="group block h-full"
    >
      <Card className="h-full p-5 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {showSubcategory && subcategoryInfo && (
              <Badge variant="secondary" className="mb-1.5 text-xs">
                {subcategoryInfo.name}
              </Badge>
            )}
            <h3 className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {template.title}
            </h3>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
          {template.shortDescription}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center gap-1">
            {template.tones.slice(0, 3).map((tone) => (
              <span 
                key={tone}
                className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize"
              >
                {tone}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center text-xs font-medium text-primary group-hover:gap-1.5 transition-all">
            Use Template
            <ArrowRight className="h-3 w-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </Card>
    </Link>
  );
};

export default TemplateCard;
