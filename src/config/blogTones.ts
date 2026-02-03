export const TONE_OPTIONS = [
  {
    value: 'expert_professional',
    label: 'Expert & Professional',
    description: 'Authoritative and knowledgeable with professional polish'
  },
  {
    value: 'informative_engaging',
    label: 'Informative & Engaging',
    description: 'Clear explanations that make complex topics accessible'
  },
  {
    value: 'casual_honest',
    label: 'Casual & Honest',
    description: 'Relaxed and straightforward, like advice from a friend'
  },
  {
    value: 'empathetic_supportive',
    label: 'Empathetic & Supportive',
    description: 'Understanding tone for people dealing with disputes'
  },
  {
    value: 'action_oriented',
    label: 'Action-Oriented',
    description: 'Direct and practical with clear next steps'
  }
] as const;

export type ToneValue = typeof TONE_OPTIONS[number]['value'];
