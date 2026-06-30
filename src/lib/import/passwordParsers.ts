/**
 * Multi-format password import parsers.
 *
 * Every parser takes the raw text the user provided (CSV or JSON export
 * from the source app) and returns normalized `ParsedCredential` rows.
 * Encryption + persistence happens later in the pipeline.
 */

export interface ParsedCredential {
  title: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  password_changed_at?: string;
}

export type ImportSource =
  | 'chrome'
  | 'edge'
  | 'firefox'
  | 'safari'
  | 'bitwarden'
  | '1password'
  | 'keeper'
  | 'lastpass'
  | 'dashlane'
  | 'csv';

export interface ParseResult {
  credentials: ParsedCredential[];
  skipped: number;
  source: ImportSource;
}

// ---------- CSV parser (RFC-4180 lite) ----------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let i = 0;
  let inQuotes = false;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = ''; i++; continue;
    }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.length));
}

function headerIndex(header: string[], candidates: string[]): number {
  const lower = header.map((h) => h.trim().toLowerCase());
  for (const cand of candidates) {
    const idx = lower.indexOf(cand);
    if (idx !== -1) return idx;
  }
  return -1;
}

function csvWithSchema(
  text: string,
  schema: { title: string[]; username: string[]; password: string[]; url: string[]; notes?: string[] },
): { creds: ParsedCredential[]; skipped: number } {
  const rows = parseCsv(text);
  if (rows.length < 2) return { creds: [], skipped: 0 };
  const header = rows[0];
  const ti = headerIndex(header, schema.title);
  const ui = headerIndex(header, schema.username);
  const pi = headerIndex(header, schema.password);
  const ri = headerIndex(header, schema.url);
  const ni = schema.notes ? headerIndex(header, schema.notes) : -1;
  if (pi === -1) return { creds: [], skipped: rows.length - 1 };

  const creds: ParsedCredential[] = [];
  let skipped = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const password = (row[pi] ?? '').trim();
    if (!password && pi === -1) { skipped++; continue; }
    const url = ri !== -1 ? (row[ri] ?? '').trim() : '';
    const username = ui !== -1 ? (row[ui] ?? '').trim() : '';
    const title = (ti !== -1 ? row[ti] : '')?.trim() || hostnameOf(url) || username || 'Imported entry';
    const notes = ni !== -1 ? (row[ni] ?? '').trim() : undefined;
    creds.push({ title, username: username || undefined, password, url: url || undefined, notes: notes || undefined });
  }
  return { creds, skipped };
}

function hostnameOf(url: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

// ---------- Per-source schemas ----------
// Browser exports (Chrome/Edge/Firefox/Safari) all use the same CSV schema:
// name,url,username,password (Firefox uses url,username,password,httpRealm,formActionOrigin,guid,timeCreated,timeLastUsed,timePasswordChanged)

const BROWSER_SCHEMA = {
  title: ['name'],
  username: ['username'],
  password: ['password'],
  url: ['url'],
};

const FIREFOX_SCHEMA = {
  title: ['name', 'url'],
  username: ['username'],
  password: ['password'],
  url: ['url'],
};

const BITWARDEN_SCHEMA = {
  title: ['name'],
  username: ['login_username'],
  password: ['login_password'],
  url: ['login_uri'],
  notes: ['notes'],
};

const ONEPASSWORD_SCHEMA = {
  title: ['title'],
  username: ['username'],
  password: ['password'],
  url: ['url', 'website'],
  notes: ['notes'],
};

const KEEPER_SCHEMA = {
  // Keeper exports: Folder,Title,Login,Password,Website Address,Notes,Shared Folder,Custom Fields
  title: ['title'],
  username: ['login'],
  password: ['password'],
  url: ['website address', 'url'],
  notes: ['notes'],
};

const LASTPASS_SCHEMA = {
  // url,username,password,totp,extra,name,grouping,fav
  title: ['name'],
  username: ['username'],
  password: ['password'],
  url: ['url'],
  notes: ['extra'],
};

const DASHLANE_SCHEMA = {
  // username,username2,username3,title,password,note,url,category,otpSecret
  title: ['title'],
  username: ['username'],
  password: ['password'],
  url: ['url'],
  notes: ['note'],
};

// ---------- Firefox timePasswordChanged enrichment ----------
function enrichFirefoxTimestamps(
  text: string,
  creds: ParsedCredential[],
): ParsedCredential[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return creds;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const tpc = header.indexOf('timepasswordchanged');
  const urlIdx = header.indexOf('url');
  const userIdx = header.indexOf('username');
  if (tpc === -1) return creds;
  const byKey = new Map<string, string>();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const ts = Number(row[tpc]);
    if (!ts) continue;
    const key = `${row[urlIdx] ?? ''}::${row[userIdx] ?? ''}`;
    byKey.set(key, new Date(ts).toISOString());
  }
  return creds.map((c) => {
    const key = `${c.url ?? ''}::${c.username ?? ''}`;
    const iso = byKey.get(key);
    return iso ? { ...c, password_changed_at: iso } : c;
  });
}

// ---------- 1Password JSON (.1pif lite / exported JSON) ----------
function parse1PasswordJson(text: string): ParsedCredential[] {
  try {
    const data = JSON.parse(text);
    const items = Array.isArray(data) ? data : data.items ?? [];
    return items
      .map((item: any) => {
        const fields = item.fields ?? item.secureContents?.fields ?? [];
        const get = (designation: string) =>
          fields.find?.((f: any) => f.designation === designation || f.purpose === designation)?.value;
        const url =
          item.overview?.url ?? item.URLs?.[0]?.u ?? (item.secureContents?.URLs?.[0]?.u);
        return {
          title: item.title ?? item.overview?.title ?? 'Imported entry',
          username: get('username') ?? item.secureContents?.username,
          password: get('password') ?? item.secureContents?.password ?? '',
          url,
          notes: item.secureContents?.notesPlain ?? item.notesPlain,
        } as ParsedCredential;
      })
      .filter((c: ParsedCredential) => !!c.password);
  } catch {
    return [];
  }
}

// ---------- Bitwarden JSON ----------
function parseBitwardenJson(text: string): ParsedCredential[] {
  try {
    const data = JSON.parse(text);
    const items = data.items ?? [];
    return items
      .filter((i: any) => i.type === 1 && i.login)
      .map((i: any) => ({
        title: i.name ?? 'Imported entry',
        username: i.login?.username ?? undefined,
        password: i.login?.password ?? '',
        url: i.login?.uris?.[0]?.uri ?? undefined,
        notes: i.notes ?? undefined,
      }))
      .filter((c: ParsedCredential) => !!c.password);
  } catch {
    return [];
  }
}

// ---------- Entry point ----------

export function parseImport(text: string, source: ImportSource): ParseResult {
  switch (source) {
    case 'chrome':
    case 'edge':
    case 'safari': {
      const { creds, skipped } = csvWithSchema(text, BROWSER_SCHEMA);
      return { credentials: creds, skipped, source };
    }
    case 'firefox': {
      const { creds, skipped } = csvWithSchema(text, FIREFOX_SCHEMA);
      return { credentials: enrichFirefoxTimestamps(text, creds), skipped, source };
    }
    case 'bitwarden': {
      // Bitwarden allows JSON or CSV exports.
      if (text.trim().startsWith('{')) {
        const creds = parseBitwardenJson(text);
        return { credentials: creds, skipped: 0, source };
      }
      const { creds, skipped } = csvWithSchema(text, BITWARDEN_SCHEMA);
      return { credentials: creds, skipped, source };
    }
    case '1password': {
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return { credentials: parse1PasswordJson(text), skipped: 0, source };
      }
      const { creds, skipped } = csvWithSchema(text, ONEPASSWORD_SCHEMA);
      return { credentials: creds, skipped, source };
    }
    case 'keeper': {
      const { creds, skipped } = csvWithSchema(text, KEEPER_SCHEMA);
      return { credentials: creds, skipped, source };
    }
    case 'lastpass': {
      const { creds, skipped } = csvWithSchema(text, LASTPASS_SCHEMA);
      return { credentials: creds, skipped, source };
    }
    case 'dashlane': {
      const { creds, skipped } = csvWithSchema(text, DASHLANE_SCHEMA);
      return { credentials: creds, skipped, source };
    }
    case 'csv':
    default: {
      const { creds, skipped } = csvWithSchema(text, {
        title: ['name', 'title', 'site'],
        username: ['username', 'login', 'email', 'user'],
        password: ['password', 'pass'],
        url: ['url', 'website', 'site', 'address'],
        notes: ['notes', 'note', 'comments'],
      });
      return { credentials: creds, skipped, source };
    }
  }
}

/** Remove duplicates by (normalized url + username + password). */
export function dedupe(creds: ParsedCredential[]): ParsedCredential[] {
  const seen = new Set<string>();
  const out: ParsedCredential[] = [];
  for (const c of creds) {
    const key = `${(c.url ?? '').toLowerCase()}::${(c.username ?? '').toLowerCase()}::${c.password}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
