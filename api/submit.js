export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { AIRTABLE_URL, AIRTABLE_TOKEN } = process.env;

  if (!AIRTABLE_URL || !AIRTABLE_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error: Missing Airtable credentials' });
  }

  try {
    const response = await fetch(AIRTABLE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Airtable Error: ${errorText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error submitting to Airtable:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
