import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import QuizProgress from '@/components/case-quiz/QuizProgress';
import QuizQuestionComponent from '@/components/case-quiz/QuizQuestion';
import QuizResultComponent from '@/components/case-quiz/QuizResult';
import { quizQuestions, quizResults } from '@/data/caseQuizData';
import { Scale, ShieldCheck, Clock, Zap } from 'lucide-react';

const MAX_POSSIBLE_SCORE = 23; // 5+5+5+5+4 = max from each question

const faqItems = [
  {
    question: 'Is this quiz legally binding?',
    answer: 'No. This quiz provides a general assessment to help you understand the potential strength of your dispute. It is not legal advice and should not replace consultation with a licensed attorney.',
  },
  {
    question: 'How accurate is the case strength score?',
    answer: 'The score is based on common factors that courts and mediators consider when evaluating disputes: evidence quality, timeline, financial impact, and prior communication attempts. However, every case is unique and outcomes depend on many factors not covered here.',
  },
  {
    question: 'What should I do after taking the quiz?',
    answer: 'Based on your results, we recommend sending a formal demand letter as a first step. Most consumer disputes are resolved through a well-crafted demand letter without needing to go to court.',
  },
  {
    question: 'Do I need a lawyer for my dispute?',
    answer: 'For most consumer disputes under $10,000, you can represent yourself. A formal demand letter is often the most effective first step. For disputes involving significant amounts or complex legal issues, consulting an attorney is recommended.',
  },
];

const CaseQuizPage = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = useCallback((value: string, points: number, next: string) => {
    const currentQ = quizQuestions[currentQuestionIndex];
    
    // If re-answering, subtract old points
    const oldAnswer = answers[currentQ.id];
    let adjustedScore = totalScore;
    if (oldAnswer) {
      const oldOption = currentQ.options.find(o => o.value === oldAnswer);
      if (oldOption) adjustedScore -= oldOption.points;
    }

    const newScore = adjustedScore + points;
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
    setTotalScore(newScore);

    // Auto-advance after short delay
    setTimeout(() => {
      if (next === 'result' || currentQuestionIndex >= quizQuestions.length - 1) {
        setShowResult(true);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 300);
  }, [currentQuestionIndex, answers, totalScore]);

  const handleRestart = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTotalScore(0);
    setShowResult(false);
  }, []);

  const getResult = () => {
    return quizResults.find(r => totalScore >= r.minScore && totalScore <= r.maxScore) || quizResults[quizResults.length - 1];
  };

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'Do I Have a Case?', url: 'https://letterofdispute.com/do-i-have-a-case' },
  ];

  return (
    <Layout>
      <SEOHead
        title="Do I Have a Case? Free Dispute Assessment Quiz | Letter of Dispute"
        description="Take our free 2-minute quiz to evaluate your consumer dispute. Get a case strength score and personalized recommendations for your next steps."
        canonicalPath="/do-i-have-a-case"
        faqItems={faqItems}
        breadcrumbs={breadcrumbs}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
        <div className="container-wide py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Scale className="h-4 w-4" />
            Free Case Assessment
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-foreground max-w-3xl mx-auto">
            Do I Have a Case?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Answer 5 quick questions to evaluate your consumer dispute and get personalized recommendations.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> 2 minutes</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> 100% free</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> Instant results</span>
          </div>
        </div>
      </section>

      {/* Quiz Body */}
      <section className="container-wide py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          {!showResult ? (
            <div className="space-y-8">
              <QuizProgress current={currentQuestionIndex + 1} total={quizQuestions.length} />
              <AnimatePresence mode="wait">
                <QuizQuestionComponent
                  question={quizQuestions[currentQuestionIndex]}
                  selectedValue={answers[quizQuestions[currentQuestionIndex].id] || null}
                  onSelect={handleSelect}
                />
              </AnimatePresence>

              {/* Back button */}
              {currentQuestionIndex > 0 && (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Previous question
                </button>
              )}
            </div>
          ) : (
            <QuizResultComponent
              result={getResult()}
              score={totalScore}
              maxPossible={MAX_POSSIBLE_SCORE}
              disputeType={answers['dispute-type'] || 'other'}
              onRestart={handleRestart}
            />
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30">
        <div className="container-wide py-12 md:py-16">
          <h2 className="text-2xl font-bold font-serif text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqItems.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CaseQuizPage;
