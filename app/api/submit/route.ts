// POST /api/submit — proxies the form payload to Airtable using server-side
// credentials. The frontend posts to the same URL as before, so the public
// form's behavior is unchanged after the Next.js migration.
export async function POST(req: Request) {
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return Response.json(
      { error: 'Server configuration error: Missing Airtable credentials' },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
    AIRTABLE_TABLE_NAME,
  )}`;

  try {
    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `Airtable Error: ${errorText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error submitting to Airtable:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
