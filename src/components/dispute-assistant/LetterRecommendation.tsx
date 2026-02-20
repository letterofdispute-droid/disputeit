import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, FileText, Sparkles } from 'lucide-react';
import { getCategoryById } from '@/data/templateCategories';
import { getTemplateBySlug, getCategoryIdFromName } from '@/data/allTemplates';
import { inferSubcategory } from '@/data/subcategoryMappings';

interface Recommendation {
  category: string;
  letter: string;
  reason: string;
}

interface LetterRecommendationProps {
  recommendation: Recommendation;
  onClose: () => void;
}

const LetterRecommendation = ({ recommendation, onClose }: LetterRecommendationProps) => {
  const category = getCategoryById(recommendation.category);
  const IconComponent = category?.icon || FileText;

  // Resolve template slug → full direct URL
  const resolvedTemplate = getTemplateBySlug(recommendation.letter);
  const directTemplateUrl = (() => {
    if (!resolvedTemplate) return null;
    const categoryId = getCategoryIdFromName(resolvedTemplate.category);
    const subcat = inferSubcategory(resolvedTemplate.slug, resolvedTemplate.category);
    const subcatSlug = subcat?.slug || 'general';
    return `/templates/${categoryId}/${subcatSlug}/${resolvedTemplate.slug}`;
  })();

  const categoryUrl = `/templates/${recommendation.category}`;

  return (
    <Card className="p-4 bg-accent/5 border-accent/20">
      <div className="flex items-start gap-3">
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ 
            backgroundColor: category?.color ? `${category.color}20` : 'hsl(var(--accent) / 0.1)',
            color: category?.color || 'hsl(var(--accent))' 
          }}
        >
          <IconComponent className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3 w-3 text-accent" />
            <span className="text-xs font-medium text-accent">Recommended for you</span>
          </div>
          
          <h4 className="font-semibold text-foreground text-sm mb-1">
            {resolvedTemplate?.title || recommendation.letter}
          </h4>
          
          <p className="text-xs text-muted-foreground mb-3">
            {recommendation.reason}
          </p>
          
          {/* Stack vertically on mobile, side-by-side on sm+ */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="sm" variant="accent" asChild onClick={onClose}>
              <Link to={directTemplateUrl || categoryUrl}>
                Use This Template
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild onClick={onClose}>
              <Link to={categoryUrl}>
                Browse {category?.name || 'Category'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LetterRecommendation;
