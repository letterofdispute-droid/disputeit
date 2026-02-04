import { Link } from 'react-router-dom';
import { getTemplateBySlug } from '@/data/allTemplates';
import { getCategoryById } from '@/data/templateCategories';
import { inferSubcategory } from '@/data/subcategoryMappings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
interface RelatedTemplatesCTAProps {
  templateSlugs: string[];
  categorySlug?: string;
}
export function RelatedTemplatesCTA({
  templateSlugs,
  categorySlug
}: RelatedTemplatesCTAProps) {
  if (!templateSlugs || templateSlugs.length === 0) {
    return null;
  }

  // Get template data for each slug
  const templates = templateSlugs.map(slug => getTemplateBySlug(slug)).filter(Boolean).slice(0, 3); // Show max 3 templates

  if (templates.length === 0) {
    return null;
  }
  return <div className="my-8 p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-lg font-bold text-foreground">
          Ready to Take Action?
        </h3>
      </div>
      
      <p className="text-muted-foreground text-sm mb-6">
        Use our professionally crafted templates to write your dispute letter:
      </p>

      <div className="space-y-3">
        {templates.map(template => {
        if (!template) return null;
        const category = getCategoryById(template.category);
        const subcategoryInfo = inferSubcategory(template.id, template.category);
        const subcategorySlug = subcategoryInfo?.slug || 'general';
        const templateUrl = `/templates/${template.category}/${subcategorySlug}/${template.slug}`;
        return <Card key={template.slug} className="group hover:shadow-md transition-all duration-200 border-border/50 bg-background">
              <CardContent className="p-4">
                <Link to={templateUrl} className="flex items-center gap-4">
                  <div className="shrink-0 p-2 bg-primary/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
                      {template.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      {category && <Badge variant="outline" className="text-xs">
                          {category.name}
                        </Badge>}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              </CardContent>
            </Card>;
      })}
      </div>

      {templates.length === 1 && <div className="mt-4">
          <Button variant="default" size="lg" className="w-full" asChild>
            <Link to={`/templates/${templates[0]!.category}/${inferSubcategory(templates[0]!.id, templates[0]!.category)?.slug || 'general'}/${templates[0]!.slug}`}>
              Create Your Letter Now <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>}

      {categorySlug && <div className="mt-4 text-center">
          <Link to={`/templates/${categorySlug}`} className="text-sm text-primary hover:text-primary/80 font-medium">
            Browse all templates in this category →
          </Link>
        </div>}
    </div>;
}
export default RelatedTemplatesCTA;