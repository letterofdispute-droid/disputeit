import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { templateCategories, getTotalTemplateCount } from '@/data/templateCategories';

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
            {totalLetterBuilders} professional letter templates across {templateCategories.length} categories. 
            Each one is structured for maximum impact.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templateCategories.map((category) => {
            return (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="group"
              >
                <Card className="relative h-full p-6 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
                  {/* Popular Badge */}
                  {category.popular && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                      Popular
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div 
                      className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
                      style={{ 
                        backgroundColor: `${category.color}20`,
                        color: category.color 
                      }}
                    >
                      <category.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {category.templateCount} letter templates
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {category.description}
                      </p>
                      <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        Start Building
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LetterCategories;
