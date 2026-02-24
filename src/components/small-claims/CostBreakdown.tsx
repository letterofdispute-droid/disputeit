import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, FileText, Clock, Users } from 'lucide-react';

const costs = [
  {
    icon: FileText,
    title: 'Filing Fees',
    range: '$15–$300',
    description: 'Varies by state and claim amount. Some states charge as little as $5 (DC) while others charge up to $300 for larger claims.',
  },
  {
    icon: Users,
    title: 'Service of Process',
    range: '$20–$75',
    description: 'Cost to have the defendant officially served with court papers via certified mail, sheriff, or process server.',
  },
  {
    icon: Clock,
    title: 'Time Investment',
    range: '3–6 hours total',
    description: 'Filling out forms (30 min), gathering evidence (1–2 hrs), and attending the hearing (1–2 hrs including wait time).',
  },
  {
    icon: DollarSign,
    title: 'Attorney Fees',
    range: '$0 (usually)',
    description: 'Most small claims courts are designed for self-representation. Many states don\'t even allow lawyers. You can do this yourself.',
  },
];

const CostBreakdown = () => {
  return (
    <section id="costs" className="py-16 bg-secondary/30">
      <div className="container-wide">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-serif text-foreground mb-3">
            How Much Does Small Claims Court Cost?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Small claims court is designed to be affordable. Here's what you can expect to pay.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {costs.map((cost, i) => {
            const Icon = cost.icon;
            return (
              <Card key={i} className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{cost.title}</h3>
                  <p className="text-2xl font-bold text-primary mb-3">{cost.range}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cost.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mt-10 max-w-3xl mx-auto text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            Total Typical Cost: $50–$150
          </p>
          <p className="text-muted-foreground">
            For most claims, the total out-of-pocket cost is under $150 — often less than an hour of a lawyer's time. 
            If you win, most states allow you to recover your filing fees from the defendant.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CostBreakdown;
