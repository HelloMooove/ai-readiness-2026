// Shape of a row in the `submissions` table. Kept in lockstep with the SQL
// schema defined in the migration. Answer values are flexible:
//   - single-choice: string
//   - multi-choice:  string[]
//   - text:          string
export type AnswerValue = string | string[] | null;
export type AnswersMap = Record<string, AnswerValue>;

export type Submission = {
  id: string;
  session_id: string;
  form_slug: string;

  created_at: string;
  updated_at: string;
  completed_at: string | null;

  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;

  answers: AnswersMap;
  score: number | null;
  tier: string | null;

  last_question_id: string | null;
  question_count: number;

  user_agent: string | null;
  referrer: string | null;
};

export type SubmissionStatus = 'all' | 'completed' | 'partial';

export function isCompleted(s: Submission): boolean {
  return s.completed_at !== null;
}
