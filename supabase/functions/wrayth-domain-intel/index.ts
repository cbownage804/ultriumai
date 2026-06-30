// Wrayth — Domain Trust Engine
// Lightweight reputation + typosquatting + brand impersonation analysis.
// Designed to return in <200ms with no external network calls (heuristic only).
// Returns a structured intel object the extension renders in the context bar.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Top brands users commonly get typosquatted against
const BRANDS = [
  "google.com", "gmail.com", "youtube.com",
  "microsoft.com", "office.com", "outlook.com", "live.com", "microsoftonline.com",
  "apple.com", "icloud.com",
  "amazon.com", "aws.amazon.com",
  "facebook.com", "instagram.com", "whatsapp.com",
  "github.com", "gitlab.com",
  "linkedin.com", "twitter.com", "x.com",
  "paypal.com", "stripe.com", "chase.com", "wellsfargo.com", "bankofamerica.com",
  "netflix.com", "spotify.com",
  "dropbox.com", "box.com",
  "salesforce.com", "slack.com", "zoom.us", "notion.so", "figma.com",
  "openai.com", "anthropic.com",
  "coinbase.com", "binance.com",
  "ultriumai.com", "ultriumai.app",
];

// Known phishing / suspicious TLDs (heuristic — does not block, just signals)
const SUSPICIOUS_TLDS = new Set([
  "zip", "mov", "country", "xin", "kim", "work", "click", "loan",
  "support", "rest", "bar", "wang", "top", "tk", "ml", "ga", "cf", "gq",
]);

// Legitimate sensitive providers — used so we don't ever falsely warn on them
const TRUSTED_EXACT = new Set([
  "google.com", "microsoft.com", "apple.com", "amazon.com", "github.com",
  "facebook.com", "x.com", "twitter.com", "linkedin.com", "youtube.com",
  "paypal.com", "stripe.com", "netflix.com", "spotify.com", "dropbox.com",
  "ultriumai.com", "ultriumai.app",
]);

function rootDomain(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, "");
  // Naive eTLD+1: take last 2 labels (works for .com, .org, .app; falls back gracefully)
  const parts = h.split(".");
  if (parts.length <= 2) return h;
  // crude two-part TLDs
  const twoPart = new Set(["co.uk", "co.jp", "com.au", "com.br", "co.in"]);
  const tail2 = parts.slice(-2).join(".");
  const tail3 = parts.slice(-3).join(".");
  return twoPart.has(tail2) ? tail3 : tail2;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length, bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  const v0 = new Array(bl + 1).fill(0);
  const v1 = new Array(bl + 1).fill(0);
  for (let i = 0; i <= bl; i++) v0[i] = i;
  for (let i = 0; i < al; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < bl; j++) {
      const cost = a.charCodeAt(i) === b.charCodeAt(j) ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= bl; j++) v0[j] = v1[j];
  }
  return v1[bl];
}

function detectTyposquat(root: string): { brand: string; distance: number } | null {
  if (TRUSTED_EXACT.has(root)) return null;
  const rootName = root.split(".")[0];
  let best: { brand: string; distance: number } | null = null;
  for (const brand of BRANDS) {
    if (brand === root) return null;
    const brandName = brand.split(".")[0];
    if (rootName === brandName) continue;
    const d = levenshtein(rootName, brandName);
    // Typosquat zone: 1–2 edits on names of at least 5 chars
    if (brandName.length >= 5 && d > 0 && d <= 2) {
      if (!best || d < best.distance) best = { brand, distance: d };
    }
    // Substring impersonation — brand inside a longer name, e.g. "microsoft-login-secure.com"
    if (brandName.length >= 6 && rootName.includes(brandName) && rootName !== brandName) {
      if (!best || best.distance > 0) best = { brand, distance: 0 };
    }
  }
  return best;
}

function isIPHost(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^\[?[a-f0-9:]+\]?$/i.test(host);
}

function hasManyHyphens(name: string): boolean {
  return (name.match(/-/g)?.length ?? 0) >= 3;
}

function hasPunycode(host: string): boolean {
  return host.includes("xn--");
}

function scoreDomain(host: string, httpsExplicit?: boolean) {
  const reasons: string[] = [];
  const positives: string[] = [];
  let score = 70; // start at neutral-good
  const root = rootDomain(host);
  const tld = root.split(".").pop() || "";
  const isIP = isIPHost(host);
  const trusted = TRUSTED_EXACT.has(root);
  const typo = detectTyposquat(root);
  const isHTTPS = httpsExplicit !== false; // default true unless told otherwise
  const punycode = hasPunycode(host);
  const manyHyphens = hasManyHyphens(root.split(".")[0]);
  const suspiciousTld = SUSPICIOUS_TLDS.has(tld);

  if (trusted) { score += 25; positives.push("This is a well-known, verified domain."); }
  if (isHTTPS) positives.push("Connection is encrypted (HTTPS).");
  else { score -= 25; reasons.push("This page is not using HTTPS — credentials could be intercepted."); }

  if (isIP) { score -= 25; reasons.push("This site is hosted on a raw IP address, which is unusual for a real service."); }
  if (punycode) { score -= 20; reasons.push("The domain uses internationalized characters (punycode) — sometimes used to mimic real brands."); }
  if (manyHyphens) { score -= 10; reasons.push("The domain contains several hyphens, which is common in phishing URLs."); }
  if (suspiciousTld) { score -= 15; reasons.push(`The ".${tld}" extension is frequently used for short-lived phishing sites.`); }

  let typosquatOf: string | null = null;
  let brandImpersonation = false;
  if (typo) {
    typosquatOf = typo.brand;
    brandImpersonation = true;
    score -= typo.distance === 0 ? 40 : 35;
    reasons.push(
      typo.distance === 0
        ? `This domain references "${typo.brand.split(".")[0]}" but is not owned by ${typo.brand}.`
        : `This domain closely resembles ${typo.brand} but is spelled differently.`,
    );
  }

  // clamp
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let level: "ok" | "info" | "warn" | "danger" = "ok";
  let headline = "This website appears legitimate.";
  if (score >= 75) { level = "ok"; headline = trusted ? "Trusted site." : "This website appears legitimate."; }
  else if (score >= 55) { level = "info"; headline = "Looks fine, but I have a couple of notes."; }
  else if (score >= 35) { level = "warn"; headline = "I'd verify this site before entering credentials."; }
  else { level = "danger"; headline = brandImpersonation
    ? `This closely resembles ${typosquatOf} but is not owned by them. I recommend leaving.`
    : "This site shows several phishing-style signals. I recommend leaving."; }

  return {
    host,
    root,
    tld,
    score,
    level,
    headline,
    reasons,
    positives,
    typosquatOf,
    brandImpersonation,
    isHTTPS,
    trusted,
    analyzedAt: new Date().toISOString(),
  };
}

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  return (async () => {
    try {
      const { host, https } = await req.json().catch(() => ({}));
      if (!host || typeof host !== "string") {
        return new Response(JSON.stringify({ error: "missing host" }), {
          status: 400, headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      const intel = scoreDomain(host.replace(/^www\./, ""), https);
      return new Response(JSON.stringify(intel), {
        headers: { ...corsHeaders, "content-type": "application/json", "cache-control": "public, max-age=3600" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
        status: 500, headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
  })();
});
