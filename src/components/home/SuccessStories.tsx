import { motion } from 'framer-motion';
import { Quote, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Story {
  id: string;
  quote: string;
  name: string;
  location: string;
  disputeType: string;
  outcome: string;
  amount?: string;
  timeToResolve: string;
  avatar: string;
}

const stories: Story[] = [
  {
    id: '1',
    quote: "I'd been calling my landlord for two months about my deposit. Sent the letter on a Monday, had a check by Friday. I couldn't believe it.",
    name: 'Marcus T.',
    location: 'Atlanta, GA',
    disputeType: 'Security Deposit',
    outcome: 'Full deposit returned',
    amount: '$1,850',
    timeToResolve: '5 days',
    avatar: 'M',
  },
  {
    id: '2',
    quote: "The hospital kept billing me for a procedure I never had. After months of phone calls getting nowhere, one letter got it removed from my account.",
    name: 'Jennifer L.',
    location: 'Phoenix, AZ',
    disputeType: 'Medical Billing Error',
    outcome: 'Charges removed',
    amount: '$2,340',
    timeToResolve: '12 days',
    avatar: 'J',
  },
  {
    id: '3',
    quote: "My insurance denied my claim three times. The appeal letter got it approved on the first try. Wish I'd done this months ago.",
    name: 'David K.',
    location: 'Chicago, IL',
    disputeType: 'Insurance Denial',
    outcome: 'Claim approved',
    amount: '$4,200',
    timeToResolve: '21 days',
    avatar: 'D',
  },
  {
    id: '4',
    quote: "Customer service kept saying they'd 'escalate' my refund request. The formal letter went straight to their legal team and I had my money back in a week.",
    name: 'Sarah M.',
    location: 'Seattle, WA',
    disputeType: 'Product Refund',
    outcome: 'Full refund received',
    amount: '$489',
    timeToResolve: '8 days',
    avatar: 'S',
  },
  {
    id: '5',
    quote: "Flight cancelled, airline blamed weather. My letter cited the regulations and pointed out other flights departed. Got €600 compensation.",
    name: 'Thomas R.',
    location: 'London, UK',
    disputeType: 'Flight Compensation',
    outcome: 'EU261 compensation paid',
    amount: '€600',
    timeToResolve: '18 days',
    avatar: 'T',
  },
  {
    id: '6',
    quote: "My HOA fined me $500 for a 'violation' that didn't exist. The letter requested documentation they couldn't provide. Fine dropped.",
    name: 'Rachel P.',
    location: 'Denver, CO',
    disputeType: 'HOA Fine Dispute',
    outcome: 'Fine cancelled',
    amount: '$500',
    timeToResolve: '14 days',
    avatar: 'R',
  },
];

const SuccessStories = () => {
  return (
    <section className="py-16 md:py-24 bg-background overflow-hidden">
      <div className="container-wide">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Real Results from Real People
          </h2>
          <p className="text-lg text-muted-foreground">
            See what happens when you stop calling and start documenting. These are outcomes from
            people who sent formal dispute letters.
          </p>
        </motion.div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 shadow-soft hover:shadow-elevated transition-shadow flex flex-col"
            >
              {/* Quote Icon */}
              <Quote className="h-8 w-8 text-primary/20 mb-4" />

              {/* Quote Text */}
              <p className="text-foreground leading-relaxed mb-6 flex-1">
                "{story.quote}"
              </p>

              {/* Outcome Stats */}
              <div className="flex flex-wrap gap-3 mb-5">
                {story.amount && (
                  <div className="flex items-center gap-1.5 text-sm bg-green-500/10 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="font-medium">{story.amount}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">{story.timeToResolve}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm bg-accent/50 text-accent-foreground px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="font-medium">{story.outcome}</span>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
                    'bg-primary/10 text-primary'
                  )}
                >
                  {story.avatar}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{story.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {story.disputeType} • {story.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto"
        >
          These testimonials represent individual experiences. Results vary based on the specific
          dispute, documentation, and recipient. A formal letter does not guarantee any particular
          outcome.
        </motion.p>
      </div>
    </section>
  );
};

export default SuccessStories;
