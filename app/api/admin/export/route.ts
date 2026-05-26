import ExcelJS from 'exceljs';
import { readSupabaseEnv } from '@/lib/supabase/env';
import { createServerSupabase } from '@/lib/supabase/server';
import { isAllowed } from '@/lib/auth/allowlist';
import { QUESTIONS } from '@/lib/form-schemas/ai-readiness-2026';
import type { Submission, AnswerValue, SubmissionStatus } from '@/lib/types/submission';

// Force Node runtime — exceljs needs full Node APIs and large bundles.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Hard limit on rows per export to keep memory/response time sane.
// At our expected volumes this is way above what would ever be exported
// in one shot.
const MAX_ROWS = 50000;

function parseTab(raw: string | null): SubmissionStatus {
  if (raw === 'completed') return 'completed';
  if (raw === 'partial') return 'partial';
  return 'all';
}

function formatAnswer(v: AnswerValue): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.filter((x) => x != null).join(', ');
  return String(v);
}

function toDateOrNull(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  // Auth: must be an authenticated admin from the allowlist.
  const env = readSupabaseEnv();
  if (!env) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAllowed(user.email)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tab = parseTab(searchParams.get('tab'));
  const rawSearch = (searchParams.get('q') ?? '').trim();
  // Strip characters that would break PostgREST's .or() filter syntax
  const search = rawSearch.replace(/[,()*]/g, '').slice(0, 100);

  let query = supabase
    .from('submissions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(MAX_ROWS);

  if (tab === 'completed') query = query.not('completed_at', 'is', null);
  else if (tab === 'partial') query = query.is('completed_at', null);

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Submission[];

  // Build workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MOOOVE Admin';
  wb.created = new Date();
  const ws = wb.addWorksheet('Submissions');

  // Static columns followed by one per question (using airtableField as
  // header so it matches what the user already sees in Airtable).
  const baseColumns: { header: string; key: string; width: number }[] = [
    { header: 'Status',             key: 'status',           width: 12 },
    { header: 'Created at',         key: 'created_at',       width: 20 },
    { header: 'Last activity',      key: 'updated_at',       width: 20 },
    { header: 'Completed at',       key: 'completed_at',     width: 20 },
    { header: 'Email',              key: 'email',            width: 32 },
    { header: 'First name',         key: 'first_name',       width: 18 },
    { header: 'Last name',          key: 'last_name',        width: 18 },
    { header: 'Phone',              key: 'phone',            width: 18 },
    { header: 'Score',              key: 'score',            width: 8  },
    { header: 'Tier',               key: 'tier',             width: 14 },
    { header: 'Questions answered', key: 'question_count',   width: 8  },
    { header: 'Last seen on',       key: 'last_question_id', width: 14 },
    { header: 'Submission ID',      key: 'id',               width: 38 },
    { header: 'Session ID',         key: 'session_id',       width: 38 },
    { header: 'User agent',         key: 'user_agent',       width: 40 },
    { header: 'Referrer',           key: 'referrer',         width: 30 },
  ];

  const questionColumns = QUESTIONS.map((q) => ({
    header: q.airtableField,
    key: `q_${q.id}`,
    width: 40,
  }));

  ws.columns = [...baseColumns, ...questionColumns];

  // Style header row
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  for (const row of rows) {
    const flatAnswers: Record<string, string> = {};
    for (const q of QUESTIONS) {
      flatAnswers[`q_${q.id}`] = formatAnswer(row.answers?.[q.id] ?? null);
    }

    ws.addRow({
      status: row.completed_at ? 'Completed' : 'Partial',
      created_at: toDateOrNull(row.created_at),
      updated_at: toDateOrNull(row.updated_at),
      completed_at: toDateOrNull(row.completed_at),
      email: row.email ?? '',
      first_name: row.first_name ?? '',
      last_name: row.last_name ?? '',
      phone: row.phone ?? '',
      score: row.score ?? null,
      tier: row.tier ?? '',
      question_count: row.question_count,
      last_question_id: row.last_question_id ?? '',
      id: row.id,
      session_id: row.session_id,
      user_agent: row.user_agent ?? '',
      referrer: row.referrer ?? '',
      ...flatAnswers,
    });
  }

  // Format date columns
  const dateColumns = ['created_at', 'updated_at', 'completed_at'];
  for (const key of dateColumns) {
    const col = ws.getColumn(key);
    col.numFmt = 'yyyy-mm-dd hh:mm';
  }

  const buffer = await wb.xlsx.writeBuffer();

  // Filename: include the active tab and date for clarity
  const today = new Date().toISOString().slice(0, 10);
  const tabPart = tab === 'all' ? '' : `-${tab}`;
  const filename = `submissions${tabPart}-${today}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
