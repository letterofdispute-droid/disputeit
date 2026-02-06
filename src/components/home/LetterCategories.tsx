import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { templateCategories, getTotalTemplateCount } from '@/data/templateCategories';
import { useCategoryImage } from '@/hooks/useCategoryImage';
import { trackCategoryCardClick } from '@/hooks/useGTM';

interface CategoryCardProps {
  category: typeof templateCategories[0];
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const { imageUrl, altText, isLoading, fallbackGradient } = useCategoryImage(
    category.id,
    category.imageKeywords[0],
    'category-card',
    category.name
  );

  const handleClick = () => {
    trackCategoryCardClick(category.id, category.name);
  };

  return (
    <Link
      to={`/templates/${category.id}`}
      className="group block"
      aria-label={`${category.name} letter templates`}
      onClick={handleClick}
    >
      <Card className="relative h-full overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
        {/* Background Image */}
        {imageUrl && (
          <img 
            src={imageUrl}
            alt={altText || `${category.name} category`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/60 to-foreground/30" />
        
        {/* Loading state */}
        {isLoading && !imageUrl && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        
        {/* Fallback gradient background if no image */}
        {!imageUrl && !isLoading && (
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient || ''}`}
            style={!fallbackGradient ? { backgroundColor: category.color } : undefined}
          />
        )}

        {/* Popular Badge */}
        {category.popular && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full z-10">
            Popular
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-end min-h-[200px]">
          <div className="flex items-start gap-3 mb-3">
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm"
            >
              <category.icon className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-accent transition-colors">
            {category.name}
          </h3>
          <p className="text-sm text-white/80 mb-3 line-clamp-2">
            {category.description}
          </p>
          <span className="inline-flex items-center text-sm font-medium text-accent group-hover:gap-2 transition-all">
            Start Building
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </Card>
    </Link>
  );
};

const LetterCategories = () => {
  const totalLetterBuilders = getTotalTemplateCount();

  return (
    <section id="letters" className="py-16 md:py-24 bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Letter Type
          </h2>
          <p className="text-lg text-muted-foreground">
            Professional letter templates across {templateCategories.length} categories. 
            Each one is structured for maximum impact.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templateCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LetterCategories;
