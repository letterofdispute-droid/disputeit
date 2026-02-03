import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { getCategoryById } from '@/data/templateCategories';
import { getGuideByCategory } from '@/data/consumerRightsContent';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Clock, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NotFound from './NotFound';

const CategoryGuidePage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  
  const category = getCategoryById(categoryId || '');
  const guide = getGuideByCategory(categoryId || '');
  
  if (!category || !guide) {
    return <NotFound />;
  }

  const Icon = category.icon;

  return (
    <Layout>
      <SEOHead
        title={`${guide.title} | Consumer Rights Guide`}
        description={guide.introduction.slice(0, 155) + '...'}
        canonicalPath={`/guides/${categoryId}`}
      />

      {/* Hero Section */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <Link 
              to="/guides" 
              className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Guides
            </Link>
            
            <div className="flex items-start gap-4 mb-6">
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                  {guide.title}
                </h1>
                <p className="text-lg text-primary-foreground/80">
                  {guide.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {guide.introduction}
              </p>
            </div>

            {/* Key Rights */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Your Key Rights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {guide.keyRights.map((right, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-semibold text-green-700">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{right.title}</h3>
                        <p className="text-muted-foreground">{right.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Two Column Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Common Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Common Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {guide.commonIssues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Action Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Action Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {guide.actionSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* Important Deadlines */}
            {guide.importantDeadlines && guide.importantDeadlines.length > 0 && (
              <Card className="mb-8 border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Important Deadlines to Know
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {guide.importantDeadlines.map((deadline, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{deadline}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <div className="bg-primary/5 rounded-xl p-8 text-center">
              <h2 className="font-serif text-xl font-bold mb-3">
                Ready to Assert Your Rights?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Use our professionally crafted letter templates to communicate your rights 
                effectively and get results.
              </p>
              <Link
                to={`/templates/${categoryId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Browse {category.name} Templates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-12 bg-muted/30">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-xl font-bold mb-6">
              Explore Other Guides
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/guides"
                className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm hover:border-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View All Guides
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CategoryGuidePage;
