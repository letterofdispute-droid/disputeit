import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { templateCategories } from '@/data/templateCategories';
import { consumerRightsGuides } from '@/data/consumerRightsContent';
import { ArrowRight, BookOpen, Scale, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const GuidesPage = () => {
  // Filter categories that have guides
  const categoriesWithGuides = templateCategories.filter(cat =>
    consumerRightsGuides.some(g => g.categoryId === cat.id)
  );

  return (
    <Layout>
      <SEOHead
        title="Consumer Rights Guides | Know Your Rights | Letter of Dispute"
        description="Comprehensive guides to consumer protection laws organized by dispute category. Learn your rights for refunds, housing, travel, insurance, and more."
        canonicalPath="/guides"
      />

      {/* Hero Section */}
      <section className="bg-primary py-16 md:py-20">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-6">
              <Scale className="h-4 w-4" />
              <span>Educational Resources</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Know Your Consumer Rights
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Understanding your legal protections is the first step to resolving disputes effectively. 
              Browse our comprehensive guides organized by category.
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-muted/30">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4 p-6 bg-background rounded-xl border border-border">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Clear Explanations</h3>
                  <p className="text-sm text-muted-foreground">
                    Complex laws explained in plain language
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-background rounded-xl border border-border">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Scale className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Your Key Rights</h3>
                  <p className="text-sm text-muted-foreground">
                    Know exactly what protections apply to you
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-background rounded-xl border border-border">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Action Steps</h3>
                  <p className="text-sm text-muted-foreground">
                    Practical guidance on how to act
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Guides Grid */}
      <section className="py-16">
        <div className="container-wide">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-4">
              Browse Guides by Category
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Select a category to learn about your specific rights and the steps you can take 
              to resolve disputes.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesWithGuides.map((category) => {
                const guide = consumerRightsGuides.find(g => g.categoryId === category.id);
                const Icon = category.icon;
                
                return (
                  <Link key={category.id} to={`/guides/${category.id}`}>
                    <Card className="h-full hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 group">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div 
                            className="p-3 rounded-lg transition-colors"
                            style={{ backgroundColor: `${category.color}15` }}
                          >
                            <Icon 
                              className="h-6 w-6 transition-colors" 
                              style={{ color: category.color }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {guide?.subtitle || category.description}
                            </p>
                            <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              Read Guide
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
              Ready to Take Action?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Once you understand your rights, use our professionally crafted letter templates 
              to assert them effectively.
            </p>
            <Link
              to="/#letters"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Letter Templates
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default GuidesPage;
