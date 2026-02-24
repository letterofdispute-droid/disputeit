import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { templateCategories } from '@/data/templateCategories';
import { legalKnowledgeDatabase, type CategoryLegalKnowledge } from '@/data/legalKnowledge';
import { Link } from 'react-router-dom';
import {
  MessageSquare, FileText, Building, Scale, ArrowRight,
  ExternalLink, Shield, Clock, AlertCircle, ChevronRight,
  BookOpen, Megaphone, Gavel
} from 'lucide-react';

const stepIcons = [MessageSquare, FileText, Building, Megaphone, Scale, Gavel];
const stepColors = [
  'bg-green-500/10 border-green-500/30 text-green-700',
  'bg-amber-500/10 border-amber-500/30 text-amber-700',
  'bg-orange-500/10 border-orange-500/30 text-orange-700',
  'bg-orange-600/10 border-orange-600/30 text-orange-800',
  'bg-red-500/10 border-red-500/30 text-red-700',
  'bg-red-600/10 border-red-600/30 text-red-800',
];
const connectorColors = ['bg-green-400', 'bg-amber-400', 'bg-orange-400', 'bg-orange-500', 'bg-red-400', 'bg-red-500'];

const defaultSteps = [
  {
    title: 'Contact the Company Directly',
    description: 'Start by contacting the business directly, by phone, email, or in writing. Document the date, who you spoke with, and what was discussed. Many disputes are resolved at this stage.',
    timeframe: 'Give them 7–14 days to respond',
  },
  {
    title: 'Send a Formal Demand Letter',
    description: 'If direct contact fails, send a formal demand letter via certified mail. This creates a legal paper trail and shows the court you tried to resolve the dispute in good faith.',
    timeframe: 'Allow 14–30 days for response',
    cta: { label: 'Browse Letter Templates', to: '/templates' },
  },
  {
    title: 'File a Regulatory Complaint',
    description: 'Report the issue to relevant federal or state agencies. Agencies like the FTC, CFPB, or your State Attorney General can investigate and sometimes intervene on your behalf.',
    timeframe: 'Agencies typically respond in 15–30 days',
  },
  {
    title: 'File a BBB or Consumer Agency Report',
    description: 'Filing with the Better Business Bureau or local consumer protection agency adds public pressure. Many businesses respond to BBB complaints to protect their rating.',
    timeframe: 'BBB forwards within 2 business days',
  },
  {
    title: 'File in Small Claims Court',
    description: 'If all else fails, file your case in small claims court. You\'ll have documented evidence of every attempt to resolve the dispute, which judges love to see.',
    timeframe: 'Hearing typically 30–60 days after filing',
    cta: { label: 'Look Up Your State', to: '#state-lookup' },
  },
];

const EscalationFlowchart = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categoryData = useMemo(() => {
    if (!selectedCategory) return null;
    return legalKnowledgeDatabase.find(k => k.categoryId === selectedCategory) || null;
  }, [selectedCategory]);

  const usInfo = categoryData?.jurisdictions?.US;

  return (
    <section id="escalation-flowchart" className="py-16">
      <div className="container-wide">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">
              <ChevronRight className="h-3.5 w-3.5 mr-1" /> Step-by-Step Guide
            </Badge>
            <h2 className="text-3xl font-bold font-serif text-foreground mb-3">
              Complaint Escalation Flowchart
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Not sure what to do next? Follow this proven escalation path, from first contact to filing in court. Select your dispute category for tailored guidance.
            </p>
          </div>

          {/* Category Selector */}
          <div className="max-w-md mx-auto mb-10">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select your dispute category (optional)..." />
              </SelectTrigger>
              <SelectContent>
                {templateCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category-specific legal info sidebar */}
          {usInfo && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up">
              {/* Statutes */}
              {usInfo.federalStatutes.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-primary" /> Laws That Protect You
                    </h4>
                    <ul className="space-y-2">
                      {usInfo.federalStatutes.slice(0, 3).map((statute, i) => (
                        <li key={i} className="text-sm">
                          <p className="font-medium text-foreground">{statute.name}</p>
                          <p className="text-xs text-muted-foreground">{statute.citation}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Key Timeframes */}
              {usInfo.timeframes.length > 0 && (
                <Card className="border-accent/20 bg-accent/5">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-accent" /> Key Deadlines
                    </h4>
                    <ul className="space-y-2">
                      {usInfo.timeframes.slice(0, 4).map((tf, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Badge variant="outline" className="text-xs flex-shrink-0 mt-0.5">
                            {tf.days} {tf.days === 1 ? 'day' : 'days'}
                          </Badge>
                          <span className="text-muted-foreground">{tf.context}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Flowchart */}
          <div className="relative">
            {/* Steps */}
            <div className="space-y-0">
              {(usInfo?.escalationPaths && usInfo.escalationPaths.length > 0 ? usInfo.escalationPaths : defaultSteps.map(s => s.title)).map((stepTitle, i, arr) => {
                const isDefault = !usInfo?.escalationPaths?.length;
                const defaultStep = isDefault ? defaultSteps[i] : null;
                const stepColorClass = stepColors[Math.min(i, stepColors.length - 1)];
                const ConnectorColor = connectorColors[Math.min(i, connectorColors.length - 1)];
                const StepIcon = stepIcons[Math.min(i, stepIcons.length - 1)];
                const isLast = i === arr.length - 1;

                // For category-specific paths, find matching agency
                const matchingAgency = usInfo?.regulatoryAgencies.find(a =>
                  typeof stepTitle === 'string' && stepTitle.toLowerCase().includes(a.abbreviation.toLowerCase())
                );

                return (
                  <div key={i} className="relative">
                    {/* Connector line */}
                    {!isLast && (
                      <div className="absolute left-6 top-[52px] bottom-0 w-0.5 z-0">
                        <div className={`w-full h-full ${ConnectorColor} opacity-30`} />
                      </div>
                    )}

                    <div className="relative z-10 flex gap-4 pb-6">
                      {/* Step Circle */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${stepColorClass}`}>
                        <StepIcon className="h-5 w-5" />
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            <span className="text-muted-foreground mr-1.5">Step {i + 1}.</span>
                            {typeof stepTitle === 'string' ? stepTitle : ''}
                          </h3>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {i === 0 ? 'Start Here' : isLast ? 'Last Resort' : `Level ${i + 1}`}
                          </Badge>
                        </div>

                        {defaultStep?.description && (
                          <p className="text-sm text-muted-foreground mb-2">{defaultStep.description}</p>
                        )}

                        {defaultStep?.timeframe && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <Clock className="h-3 w-3" /> {defaultStep.timeframe}
                          </p>
                        )}

                        {/* Agency link for category-specific */}
                        {matchingAgency?.complaintUrl && (
                          <Button variant="outline" size="sm" asChild className="mt-1">
                            <a href={matchingAgency.complaintUrl} target="_blank" rel="noopener noreferrer">
                              File Complaint at {matchingAgency.abbreviation}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        )}

                        {defaultStep?.cta && (
                          <Button variant="outline" size="sm" asChild className="mt-1">
                            {defaultStep.cta.to.startsWith('#') ? (
                              <a href={defaultStep.cta.to}>
                                {defaultStep.cta.label} <ArrowRight className="ml-1 h-3 w-3" />
                              </a>
                            ) : (
                              <Link to={defaultStep.cta.to}>
                                {defaultStep.cta.label} <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consumer Rights for selected category */}
          {usInfo && usInfo.federalStatutes.length > 0 && (
            <Card className="mt-8 border-border animate-fade-up">
              <CardContent className="p-5">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Your Rights: {categoryData?.category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {usInfo.federalStatutes.flatMap(s => s.consumerRights).slice(0, 8).map((right, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Shield className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{right}</span>
                    </div>
                  ))}
                </div>

                {/* Typical violations */}
                {usInfo.federalStatutes.some(s => s.typicalViolations.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" /> Common Violations to Watch For
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {usInfo.federalStatutes.flatMap(s => s.typicalViolations).slice(0, 6).map((violation, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{violation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border text-center">
                  <Button variant="default" asChild>
                    <Link to={`/templates/${selectedCategory}`}>
                      Browse {categoryData?.category} Templates <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default EscalationFlowchart;
