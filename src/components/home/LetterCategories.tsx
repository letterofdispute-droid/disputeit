import { Link } from 'react-router-dom';
import { ArrowRight, Receipt, Home, Package, Briefcase, Car, Plane } from 'lucide-react';
import { Card } from '@/components/ui/card';

const categories = [
  {
    icon: Receipt,
    title: 'Refund Requests',
    description: 'Get your money back for faulty products, cancelled services, or unfulfilled orders.',
    href: '/complaint-letter/refund',
    popular: true,
  },
  {
    icon: Home,
    title: 'Landlord & Housing',
    description: 'Request repairs, address deposit disputes, or document housing issues.',
    href: '/complaint-letter/landlord-repairs',
    popular: true,
  },
  {
    icon: Package,
    title: 'Damaged Goods',
    description: 'File complaints for items that arrived broken, defective, or not as described.',
    href: '/complaint-letter/damaged-goods',
    popular: false,
  },
  {
    icon: Briefcase,
    title: 'Employment Issues',
    description: 'Address workplace disputes, unpaid wages, or unfair treatment.',
    href: '/complaint-letter/employment',
    popular: false,
    comingSoon: true,
  },
  {
    icon: Car,
    title: 'Vehicle & Insurance',
    description: 'Dispute insurance claims, warranty issues, or vehicle purchase problems.',
    href: '/complaint-letter/vehicle',
    popular: false,
    comingSoon: true,
  },
  {
    icon: Plane,
    title: 'Travel & Airlines',
    description: 'Claim compensation for delays, cancellations, or lost baggage.',
    href: '/complaint-letter/travel',
    popular: false,
    comingSoon: true,
  },
];

const LetterCategories = () => {
  return (
    <section id="letters" className="py-16 md:py-24 bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Letter Type
          </h2>
          <p className="text-lg text-muted-foreground">
            Select the type of dispute or complaint you need to address. 
            Each template is professionally structured for maximum impact.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.title}
              to={category.comingSoon ? '#' : category.href}
              className={`group ${category.comingSoon ? 'cursor-not-allowed' : ''}`}
            >
              <Card className={`relative h-full p-6 transition-all duration-300 ${
                category.comingSoon 
                  ? 'opacity-60' 
                  : 'hover:shadow-elevated hover:-translate-y-1'
              }`}>
                {/* Popular Badge */}
                {category.popular && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                    Popular
                  </div>
                )}

                {/* Coming Soon Badge */}
                {category.comingSoon && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full">
                    Coming Soon
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <category.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>
                    {!category.comingSoon && (
                      <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        Create Letter
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LetterCategories;
