// Admin-side metadata for the AI Readiness 2026 form. Mirrors the question
// definitions in /public/app.js — used by the admin to render readable
// question text alongside answer values, and to build Excel export headers.
//
// Phase 2 will move forms into the database; until then this file is the
// single source of truth for question-id → human-readable text on the
// server side.

export type FormPhase = {
  id: 1 | 2 | 3 | 4;
  label: string;
};

export type FormQuestion = {
  id: string; // 'q1', 'q2', ... 'q18'
  phase: 1 | 2 | 3;
  text: string;
  type: 'single' | 'multi' | 'text';
  airtableField: string;
};

export const PHASES: Record<number, string> = {
  1: 'Relationship with AI',
  2: 'AI Today',
  3: 'AI Tomorrow',
  4: 'Contact Details',
};

export const QUESTIONS: FormQuestion[] = [
  { id: 'q1',  phase: 1, type: 'single', text: 'Are you AI literate?',                                              airtableField: 'Q1 - Are you AI literate?' },
  { id: 'q2',  phase: 1, type: 'single', text: 'How often do you use AI?',                                          airtableField: 'Q2 - How often do you use AI?' },
  { id: 'q3',  phase: 1, type: 'multi',  text: 'What do you use AI for?',                                           airtableField: 'Q3 - What do you use AI for?' },
  { id: 'q4',  phase: 1, type: 'multi',  text: 'What conversational AI tools do you use?',                          airtableField: 'Q4 - What conversational AI do you use?' },
  { id: 'q5',  phase: 1, type: 'single', text: 'What is the size of your company?',                                 airtableField: 'Q5 - Company Size' },
  { id: 'q6',  phase: 1, type: 'single', text: 'What is your current job title?',                                   airtableField: 'Q6 - Current Job Title' },
  { id: 'q7',  phase: 2, type: 'multi',  text: 'What are your current business challenges?',                        airtableField: 'Q7 - Current Business Challenges' },
  { id: 'q8',  phase: 2, type: 'single', text: 'Have you considered AI as a solution to solve these problems?',     airtableField: 'Q8 - Considered AI as a Solution?' },
  { id: 'q9',  phase: 2, type: 'single', text: 'How did you proceed?',                                              airtableField: 'Q9 - How did you proceed with AI?' },
  { id: 'q10', phase: 2, type: 'single', text: "What's preventing you from doing so?",                              airtableField: 'Q10 - What prevents AI adoption?' },
  { id: 'q11', phase: 2, type: 'single', text: 'How do you track or measure your business KPIs?',                   airtableField: 'Q11 - How do you track business KPI?' },
  { id: 'q12', phase: 2, type: 'single', text: 'In which industry is your organization active?',                    airtableField: 'Q12 - Industry' },
  { id: 'q13', phase: 2, type: 'multi',  text: 'What are your top 3 business priorities today?',                    airtableField: 'Q13 - Top 3 Business Priorities' },
  { id: 'q14', phase: 3, type: 'multi',  text: 'What decisions are currently difficult to make in your organization?', airtableField: 'Q14 - Difficult Decisions in Organization' },
  { id: 'q15', phase: 3, type: 'single', text: 'Do you plan to train your teams on AI usage in 2026?',              airtableField: 'Q15 - Plan to train teams on AI in 2026?' },
  { id: 'q16', phase: 3, type: 'multi',  text: 'What training themes do you want to cover?',                        airtableField: 'Q16 - AI Training Themes to Cover' },
  { id: 'q17', phase: 3, type: 'text',   text: 'Why not?',                                                          airtableField: 'Q17 - Why not training teams on AI?' },
  { id: 'q18', phase: 3, type: 'multi',  text: 'What are the must-haves of a solid AI training in 2026?',           airtableField: 'Q18 - Must-Haves of a Solid AI Training in 2026' },
];

export const QUESTIONS_BY_ID: Record<string, FormQuestion> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export function getQuestion(id: string): FormQuestion | undefined {
  return QUESTIONS_BY_ID[id];
}
