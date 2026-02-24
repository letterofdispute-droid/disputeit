import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { QuizResult as QuizResultType, disputeTypeToCategory } from '@/data/caseQuizData';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, RotateCcw, FileText, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuizResultProps {
  result: QuizResultType;
  score: number;
  maxPossible: number;
  disputeType: string;
  onRestart: () => void;
}

const iconMap = {
  strong: CheckCircle2,
  moderate: AlertTriangle,
  weak: XCircle,
};

const QuizResultComponent = ({ result, score, maxPossible, disputeType, onRestart }: QuizResultProps) => {
  const Icon = iconMap[result.strength];
  const category = disputeTypeToCategory[disputeType] || disputeTypeToCategory.other;
  const scorePercent = Math.round((score / maxPossible) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Score Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto w-24 h-24 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${result.color}15` }}
        >
          <Icon className="h-12 w-12" style={{ color: result.color }} />
        </motion.div>

        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
            {result.title}
          </h2>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-lg font-bold" style={{ color: result.color }}>
              {scorePercent}%
            </span>
            <span className="text-sm text-muted-foreground">case strength score</span>
          </div>
        </div>

        {/* Score bar */}
        <div className="max-w-xs mx-auto">
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${scorePercent}%` }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: result.color }}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground leading-relaxed">{result.description}</p>
      </div>

      {/* Recommendations */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-primary" />
          Recommended Next Steps
        </h3>
        <ul className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-start gap-3"
            >
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary mt-0.5"
              >
                {i + 1}
              </span>
              <span className="text-sm text-muted-foreground">{rec}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to={`/templates/${category.categoryId}`}>
          <Button size="lg" className="w-full gap-2">
            <FileText className="h-5 w-5" />
            Browse {category.label} Templates
          </Button>
        </Link>
        <Link to="/small-claims">
          <Button variant="outline" size="lg" className="w-full gap-2">
            <Scale className="h-5 w-5" />
            Small Claims Court Guide
          </Button>
        </Link>
      </div>

      {/* Restart */}
      <div className="text-center">
        <button
          onClick={onRestart}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <RotateCcw className="h-4 w-4" />
          Take the quiz again
        </button>
      </div>
    </motion.div>
  );
};

export default QuizResultComponent;
