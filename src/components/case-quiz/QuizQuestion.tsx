import { motion } from 'framer-motion';
import { QuizQuestion as QuizQuestionType } from '@/data/caseQuizData';
import { CheckCircle2, HelpCircle } from 'lucide-react';

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedValue: string | null;
  onSelect: (value: string, points: number, next: string) => void;
}

const QuizQuestionComponent = ({ question, selectedValue, onSelect }: QuizQuestionProps) => {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground font-serif">
          {question.question}
        </h2>
        {question.helpText && (
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 flex-shrink-0" />
            {question.helpText}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {question.options.map((option, i) => {
          const isSelected = selectedValue === option.value;
          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(option.value, option.points, option.next || 'result')}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 group ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30 group-hover:border-primary/50'
                }`}
              >
                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
              </div>
              <span className={`text-sm md:text-base font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuizQuestionComponent;
