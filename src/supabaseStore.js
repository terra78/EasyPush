const TABLE_NAME = "product_watch_status";

function assertEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function getHeaders() {
  const key = assertEnv("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
}

function getBaseUrl() {
  const base = assertEnv("SUPABASE_URL");
  return `${base}/rest/v1/${TABLE_NAME}`;
}

export async function fetchStatuses(urls) {
  if (urls.length === 0) {
    return new Map();
  }

  const inClause = urls.map((url) => `"${url}"`).join(",");
  const endpoint =
    `${getBaseUrl()}?select=*` +
    `&url=in.(${encodeURIComponent(inClause)})`;

  const response = await fetch(endpoint, { headers: getHeaders() });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase fetch failed: ${response.status} ${body}`);
  }

  const rows = await response.json();
  const map = new Map();
  for (const row of rows) {
    map.set(row.url, row);
  }
  return map;
}

export async function upsertStatuses(rows) {
  if (rows.length === 0) {
    return;
  }

  const endpoint = `${getBaseUrl()}?on_conflict=url`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...getHeaders(),
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase upsert failed: ${response.status} ${body}`);
  }
}
