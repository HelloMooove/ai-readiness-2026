import { getAdminSupabase } from './supabase/admin';
import { encrypt, tryDecrypt } from './encryption';

export type Form = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  schema: Record<string, unknown>;
  airtable_pat_encrypted: string | null;
  airtable_base_id_encrypted: string | null;
  airtable_table_name_encrypted: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type AirtableCreds = {
  pat: string | null;
  baseId: string | null;
  tableName: string | null;
};

// Fetch a form by its slug. Returns null if Supabase isn't configured or
// the form doesn't exist. /api/submit calls this on every submission, so
// it must never throw.
export async function getFormBySlug(slug: string): Promise<Form | null> {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) {
      console.error('getFormBySlug failed:', error.message);
      return null;
    }
    return (data as Form) ?? null;
  } catch (err) {
    console.error('getFormBySlug threw:', err);
    return null;
  }
}

export async function listForms(): Promise<Form[]> {
  const supabase = getAdminSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('listForms failed:', error.message);
    return [];
  }
  return (data ?? []) as Form[];
}

// Decrypt the Airtable credentials stored on a form row. Each field
// independently decrypts — if one is corrupt or encrypted with a different
// key, the others can still be returned.
export function decryptAirtableCreds(form: Form): AirtableCreds {
  return {
    pat: tryDecrypt(form.airtable_pat_encrypted),
    baseId: tryDecrypt(form.airtable_base_id_encrypted),
    tableName: tryDecrypt(form.airtable_table_name_encrypted),
  };
}

// Resolve the Airtable credentials for a form, falling back to the
// AIRTABLE_* env vars when a form-specific value is missing. This lets the
// existing AI Readiness form keep working before the admin UI is wired up.
export function resolveAirtableCreds(form: Form | null): AirtableCreds {
  const formCreds = form ? decryptAirtableCreds(form) : { pat: null, baseId: null, tableName: null };
  return {
    pat: formCreds.pat ?? process.env.AIRTABLE_PAT ?? null,
    baseId: formCreds.baseId ?? process.env.AIRTABLE_BASE_ID ?? null,
    tableName: formCreds.tableName ?? process.env.AIRTABLE_TABLE_NAME ?? null,
  };
}

// Update an Airtable credential on a form row. Passing null clears the
// field; passing a string encrypts and stores it. Passing undefined leaves
// the field untouched (so the admin UI can save other changes without
// re-entering credentials).
export type AirtableCredsUpdate = {
  pat?: string | null;
  baseId?: string | null;
  tableName?: string | null;
};

export type FormUpdate = {
  name?: string;
  description?: string | null;
  active?: boolean;
  schema?: Record<string, unknown>;
  airtable?: AirtableCredsUpdate;
};

export async function updateForm(
  slug: string,
  updates: FormUpdate,
): Promise<{ error: string | null }> {
  const supabase = getAdminSupabase();
  if (!supabase) return { error: 'Supabase not configured (service role key missing)' };

  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.active !== undefined) dbUpdates.active = updates.active;
  if (updates.schema !== undefined) dbUpdates.schema = updates.schema;

  if (updates.airtable) {
    const { pat, baseId, tableName } = updates.airtable;
    if (pat !== undefined) {
      dbUpdates.airtable_pat_encrypted = pat === null ? null : encrypt(pat);
    }
    if (baseId !== undefined) {
      dbUpdates.airtable_base_id_encrypted = baseId === null ? null : encrypt(baseId);
    }
    if (tableName !== undefined) {
      dbUpdates.airtable_table_name_encrypted = tableName === null ? null : encrypt(tableName);
    }
  }

  if (Object.keys(dbUpdates).length === 0) {
    return { error: null }; // Nothing to update
  }

  const { error } = await supabase.from('forms').update(dbUpdates).eq('slug', slug);
  return { error: error?.message ?? null };
}
