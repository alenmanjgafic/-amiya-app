/**
 * ACTIVITY COMPONENTS INDEX
 * Central export for all activity types
 */

export { default as QuizGame } from './QuizGame';
export { default as ChatPractice } from './ChatPractice';
export { default as Pick } from './Pick';
export { default as Nudge } from './Nudge';
export { default as Reflection } from './Reflection';
export { default as Commitment } from './Commitment';

// Activity type configuration
export const ACTIVITY_TYPES = {
  quiz: {
    component: 'QuizGame',
    label: 'QUIZ',
    description: 'Interaktives Quiz mit Feedback',
  },
  chat_practice: {
    component: 'ChatPractice',
    label: 'PRACTICE',
    description: 'Üben mit Amiya im Chat',
  },
  pick: {
    component: 'Pick',
    label: 'PICK',
    description: 'Routine gestalten',
  },
  nudge: {
    component: 'Nudge',
    label: 'NUDGE',
    description: 'Reflexion + Aktion',
  },
  reflection: {
    component: 'Reflection',
    label: 'REFLECTION',
    description: 'Geführte Reflexion',
  },
  commitment: {
    component: 'Commitment',
    label: 'COMMITMENT',
    description: 'Vereinbarung erstellen',
  },
};
