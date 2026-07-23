import handler from "./dist/server/server.js";

const PORT = 3000;
const HOST = "0.0.0.0";
const CLIENT_DIR = `${import.meta.dir}/dist/client`;

const freePort =
  `for _ in $(seq 1 25); do ` +
  `pids=$(lsof -t -iTCP:${String(PORT)} -sTCP:LISTEN 2>/dev/null || true); ` +
  `if [ -z "$pids" ]; then exit 0; fi; ` +
  `kill $pids 2>/dev/null || true; sleep 0.2; ` +
  `done`;

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_BODY_SIZE = 1_048_576; // 1 MB
const MAX_PAGE_LIMIT = 1000;
const DEFAULT_PAGE_LIMIT = 100;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Validation Utilities ──────────────────────────────────────────────────────

function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

function jsonError(status: number, error: string, details?: Record<string, unknown>, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error, ...(details || {}) }), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

interface FieldSchema {
  id: string;
  name: string;
  type: string;
  field_order: number;
  config: Record<string, unknown>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateRecordData(body: unknown, fields: FieldSchema[]): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, errors: ["Request body must be a JSON object"] };
  }

  const data = body as Record<string, unknown>;
  const fieldNames = new Set(fields.map((f) => f.name));
  const fieldMap = new Map(fields.map((f) => [f.name, f]));

  // Check for unknown fields
  for (const key of Object.keys(data)) {
    if (!fieldNames.has(key)) {
      errors.push(`Unknown field: "${key}". Valid fields are: ${Array.from(fieldNames).join(", ")}`);
    }
  }

  // Validate each known field's value
  for (const field of fields) {
    const value = data[field.name];

    // Skip null/undefined — they're allowed (field not provided)
    if (value === null || value === undefined) {
      continue;
    }

    switch (field.type) {
      case "number":
        if (typeof value !== "number" || isNaN(value)) {
          errors.push(`Field "${field.name}" must be a number, got ${typeof value}`);
        }
        break;

      case "currency":
        if (typeof value !== "number" || isNaN(value)) {
          errors.push(`Field "${field.name}" must be a currency value (number), got ${typeof value}`);
        }
        break;

      case "text":
        if (typeof value !== "string") {
          errors.push(`Field "${field.name}" must be a string, got ${typeof value}`);
        }
        break;

      case "select": {
        if (typeof value !== "string") {
          errors.push(`Field "${field.name}" must be a string (selected option), got ${typeof value}`);
        } else {
          const config = field.config as Record<string, string[]>;
          const options = config?.options;
          if (Array.isArray(options) && options.length > 0 && !options.includes(value)) {
            errors.push(`Field "${field.name}" has invalid option "${value}". Valid options are: ${options.join(", ")}`);
          }
        }
        break;
      }

      case "boolean":
        if (typeof value !== "boolean") {
          errors.push(`Field "${field.name}" must be a boolean (true/false), got ${typeof value}`);
        }
        break;

      case "date": {
        if (typeof value !== "string") {
          errors.push(`Field "${field.name}" must be a date string (ISO 8601 or YYYY-MM-DD), got ${typeof value}`);
        } else {
          const d = new Date(value);
          if (isNaN(d.getTime())) {
            errors.push(`Field "${field.name}" is not a valid date: "${value}"`);
          }
        }
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function getPaginationParams(url: URL): { limit: number; offset: number } {
  const limitRaw = parseInt(url.searchParams.get("limit") || "", 10);
  const offsetRaw = parseInt(url.searchParams.get("offset") || "", 10);

  let limit = !isNaN(limitRaw) && limitRaw > 0 ? limitRaw : DEFAULT_PAGE_LIMIT;
  if (limit > MAX_PAGE_LIMIT) limit = MAX_PAGE_LIMIT;

  const offset = !isNaN(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

  return { limit, offset };
}

// ── Rate Limiter ─────────────────────────────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMITS = {
  general: { windowMs: 60_000, maxRequests: 100 },    // 100 req/min
  write: { windowMs: 60_000, maxRequests: 20 },       // 20 req/min for mutations
} as const;

function checkRateLimit(key: string, isWrite: boolean): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const config = isWrite ? RATE_LIMITS.write : RATE_LIMITS.general;
  
  let entry = rateLimitMap.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitMap.set(key, entry);
  }
  
  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);
  
  if (entry.timestamps.length >= config.maxRequests) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + config.windowMs - now) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }
  
  entry.timestamps.push(now);
  return { allowed: true, retryAfter: 0 };
}

// Periodic cleanup to prevent memory leaks — run every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 60_000);
    if (entry.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}, 300_000);

// ── Security Headers ──────────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.stripe.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev",
  "img-src 'self' data: blob: https://*.clerk.accounts.dev https://img.clerk.com",
  "connect-src 'self' https://*.clerk.accounts.dev https://api.stripe.com https://*.stripe.com wss://*.clerk.accounts.dev",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.stripe.com https://js.stripe.com",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function addSecurityHeaders(res: Response, extraCSP?: string): Response {
  const headers = new Headers(res.headers);
  for (const [key, val] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, val);
  }
  headers.set("Content-Security-Policy", CSP_HEADER + (extraCSP ? "; " + extraCSP : ""));
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

function getCacheControl(pathname: string): string {
  if (pathname.startsWith("/api/") || pathname.startsWith("/dashboard") || pathname === "/pricing") {
    return "no-store";
  }
  if (pathname.startsWith("/assets/") || pathname.startsWith("/static/")) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=0, must-revalidate";
}

// ── Body Size Limit Helper ────────────────────────────────────────────────────

async function readJsonBody(req: Request): Promise<{ ok: boolean; data: unknown; error?: string }> {
  // Check Content-Length header first
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const len = parseInt(contentLength, 10);
    if (!isNaN(len) && len > MAX_BODY_SIZE) {
      return { ok: false, data: null, error: `Request body too large (${len} bytes). Maximum is ${MAX_BODY_SIZE} bytes (1 MB).` };
    }
  }

  try {
    const text = await req.text();
    if (text.length > MAX_BODY_SIZE) {
      return { ok: false, data: null, error: `Request body too large (${text.length} bytes). Maximum is ${MAX_BODY_SIZE} bytes (1 MB).` };
    }
    return { ok: true, data: JSON.parse(text) };
  } catch (e) {
    const msg = e instanceof SyntaxError ? "Invalid JSON in request body" : String(e);
    return { ok: false, data: null, error: msg };
  }
}

// ── Security Logging ──────────────────────────────────────────────────────────

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

interface ApiLogEntry {
  userId?: string;
  eventType: string;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

async function logApiEvent(sql: any, entry: ApiLogEntry): Promise<void> {
  try {
    await sql`
      INSERT INTO api_logs (user_id, event_type, resource, details, ip_address)
      VALUES (
        ${entry.userId || null},
        ${entry.eventType},
        ${entry.resource},
        ${JSON.stringify(entry.details || {})}::jsonb,
        ${entry.ipAddress || null}
      )
    `;
  } catch {
    // Logging is best-effort — never fail the request over a log write
  }
}

// ── REST API Handler ─────────────────────────────────────────────────────────

async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": CSP_HEADER,
    "Cache-Control": "no-store",
  };

  const jsonErr = (status: number, error: string, extra?: Record<string, unknown>) =>
    new Response(JSON.stringify({ error, ...(extra || {}) }), {
      status,
      headers: { "content-type": "application/json", ...corsHeaders },
    });

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Extract API key from header
  const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "") || "";
  if (!apiKey) {
    return jsonErr(401, "API key required. Set X-API-Key header.");
  }

  // Validate API key
  const { neon } = await import("@neondatabase/serverless");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return jsonErr(500, "Database not configured");
  }
  const sql = neon(dbUrl);
  const crypto = await import("node:crypto");
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const [keyRow] = await sql`SELECT id, user_id, revoked FROM api_keys WHERE key_hash = ${keyHash}`;
  if (!keyRow || keyRow.revoked) {
    // Log failed auth attempt
    await logApiEvent(sql, {
      eventType: "auth_failed",
      resource: "api_key",
      details: {
        reason: keyRow?.revoked ? "revoked" : "invalid",
        keyPrefix: apiKey.length > 12 ? apiKey.slice(0, 12) + "..." : apiKey.slice(0, 8),
      },
      ipAddress: getClientIp(req),
    });
    return jsonErr(401, "Invalid or revoked API key");
  }

  // Check subscription tier
  const [user] = await sql`SELECT subscription_tier FROM users WHERE id = ${keyRow.user_id}`;
  if (!user || user.subscription_tier === "free") {
    await logApiEvent(sql, {
      userId: keyRow.user_id,
      eventType: "auth_blocked",
      resource: "subscription",
      details: { reason: "free_tier" },
      ipAddress: getClientIp(req),
    });
    return jsonErr(403, "API access requires Pro or Team subscription");
  }

  // Update last used
  await sql`UPDATE api_keys SET last_used_at = NOW() WHERE id = ${keyRow.id}::uuid`;

  const userId = keyRow.user_id;

  // Log successful auth
  await logApiEvent(sql, {
    userId,
    eventType: "auth_success",
    resource: "api_key",
    details: { keyId: keyRow.id, tier: user.subscription_tier },
    ipAddress: getClientIp(req),
  });

  // Rate limiting — per-user sliding window
  const isWrite = method === "POST" || method === "PUT" || method === "DELETE";
  const rateResult = checkRateLimit(`api:${userId}`, isWrite);
  if (!rateResult.allowed) {
    await logApiEvent(sql, {
      userId,
      eventType: "rate_limited",
      resource: path,
      details: { method, retryAfter: rateResult.retryAfter },
      ipAddress: getClientIp(req),
    });
    return jsonErr(429, "Rate limit exceeded", {
      retryAfter: rateResult.retryAfter,
    });
  }

  // ── Helper: Validate UUID in path ─────────────────────────────────────────────

  function requireUUID(paramName: string, value: string): Response | null {
    if (!isValidUUID(value)) {
      return jsonErr(400, `Invalid ${paramName}: "${value}". Must be a valid UUID.`);
    }
    return null;
  }

  // ── Helper: Fetch and validate database fields for schema validation ──────────

  async function getFieldsForDatabase(dbId: string): Promise<{ fields: FieldSchema[]; dbCheck: any; error?: Response }> {
    const uuidErr = requireUUID("database ID", dbId);
    if (uuidErr) return { fields: [], dbCheck: null, error: uuidErr };

    const [dbCheck] = await sql`SELECT id, user_id FROM databases WHERE id = ${dbId}::uuid`;
    if (!dbCheck) {
      return { fields: [], dbCheck: null, error: jsonErr(404, `Database not found: ${dbId}`) };
    }

    const fieldRows = await sql`
      SELECT id, name, type, field_order, config FROM fields
      WHERE database_id = ${dbId}::uuid ORDER BY field_order ASC
    `;
    const fields = fieldRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      field_order: r.field_order,
      config: typeof r.config === "string" ? JSON.parse(r.config) : (r.config || {}),
    }));

    return { fields, dbCheck };
  }

  // ── Route Matching ────────────────────────────────────────────────────────────

  // GET /api/v1/databases
  if (path === "/api/v1/databases" && method === "GET") {
    const { limit, offset } = getPaginationParams(url);
    const rows = await sql`
      SELECT id, name, description, created_at FROM databases
      WHERE user_id = ${userId} ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count for pagination metadata
    const [countRow] = await sql`
      SELECT COUNT(*)::int as total FROM databases WHERE user_id = ${userId}
    `;

    await logApiEvent(sql, {
      userId,
      eventType: "list_databases",
      resource: "databases",
      details: { count: rows.length, limit, offset },
      ipAddress: getClientIp(req),
    });

    return new Response(JSON.stringify({
      data: rows.map((r: any) => ({ ...r, created_at: String(r.created_at) })),
      pagination: { limit, offset, total: (countRow as any)?.total || 0 },
    }), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }

  // GET /api/v1/databases/:id/export
  const exportMatch = path.match(/^\/api\/v1\/databases\/([a-f0-9-]+)\/export$/);
  if (exportMatch && method === "GET") {
    const dbId = exportMatch[1];
    const uuidErr = requireUUID("database ID", dbId);
    if (uuidErr) return uuidErr;

    const [dbInfo] = await sql`SELECT name FROM databases WHERE id = ${dbId}::uuid`;
    if (!dbInfo) {
      return jsonErr(404, `Database not found: ${dbId}`);
    }

    const fields = await sql`SELECT name FROM fields WHERE database_id = ${dbId}::uuid ORDER BY field_order ASC`;
    const records = await sql`SELECT data FROM records WHERE database_id = ${dbId}::uuid ORDER BY created_at DESC`;

    // Log the export event
    await logApiEvent(sql, {
      userId,
      eventType: "data_export",
      resource: `databases/${dbId}/export`,
      details: {
        databaseName: (dbInfo as any)?.name,
        recordCount: records.length,
        fieldCount: fields.length,
      },
      ipAddress: getClientIp(req),
    });
    const fieldNames = fields.map((f: any) => f.name);
    const header = fieldNames.join(",");
    const rows = records.map((r: any) => {
      const d = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      return fieldNames.map((n: string) => {
        const val = d[n];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(",");
    });
    return new Response([header, ...rows].join("\n"), {
      headers: {
        "content-type": "text/csv",
        "content-disposition": `attachment; filename="${(dbInfo as any)?.name || "export"}.csv"`,
        ...corsHeaders,
      },
    });
  }

  // GET /api/v1/databases/:id
  const dbMatch = path.match(/^\/api\/v1\/databases\/([a-f0-9-]+)$/);
  if (dbMatch && method === "GET") {
    const dbId = dbMatch[1];
    const uuidErr = requireUUID("database ID", dbId);
    if (uuidErr) return uuidErr;

    const { limit, offset } = getPaginationParams(url);

    const [dbInfo] = await sql`SELECT id, name FROM databases WHERE id = ${dbId}::uuid`;
    if (!dbInfo) {
      return jsonErr(404, `Database not found: ${dbId}`);
    }

    const fields = await sql`
      SELECT id, name, type, field_order FROM fields
      WHERE database_id = ${dbId}::uuid ORDER BY field_order ASC
    `;
    const records = await sql`
      SELECT id, data, created_at, updated_at FROM records
      WHERE database_id = ${dbId}::uuid ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [countRow] = await sql`
      SELECT COUNT(*)::int as total FROM records WHERE database_id = ${dbId}::uuid
    `;

    await logApiEvent(sql, {
      userId,
      eventType: "get_database",
      resource: `databases/${dbId}`,
      details: { databaseName: (dbInfo as any)?.name, recordCount: records.length },
      ipAddress: getClientIp(req),
    });

    return new Response(JSON.stringify({
      fields: fields.map((f: any) => ({ ...f, config: {} })),
      records: records.map((r: any) => ({
        id: r.id,
        data: typeof r.data === "string" ? JSON.parse(r.data) : r.data,
        created_at: String(r.created_at),
        updated_at: String(r.updated_at),
      })),
      pagination: { limit, offset, total: (countRow as any)?.total || 0 },
    }), { headers: { "content-type": "application/json", ...corsHeaders } });
  }

  // POST /api/v1/databases/:id/records
  const postMatch = path.match(/^\/api\/v1\/databases\/([a-f0-9-]+)\/records$/);
  if (postMatch && method === "POST") {
    const dbId = postMatch[1];

    // 1. Validate database ID is a valid UUID
    const uuidErr = requireUUID("database ID", dbId);
    if (uuidErr) return uuidErr;

    // 2. Fetch the database schema
    const { fields, dbCheck, error: fieldsErr } = await getFieldsForDatabase(dbId);
    if (fieldsErr) return fieldsErr;

    // 3. Read and validate body size
    const bodyResult = await readJsonBody(req);
    if (!bodyResult.ok) {
      return jsonErr(400, bodyResult.error || "Invalid request body");
    }

    // 4. Validate record data against schema
    const validation = validateRecordData(bodyResult.data, fields);
    if (!validation.valid) {
      return jsonErr(400, "Validation failed", { details: validation.errors });
    }

    // 5. Insert the record
    const [record] = await sql`
      INSERT INTO records (database_id, data)
      VALUES (${dbId}::uuid, ${JSON.stringify(bodyResult.data)}::jsonb)
      RETURNING id, data, created_at
    `;

    await logApiEvent(sql, {
      userId,
      eventType: "create_record",
      resource: `databases/${dbId}/records`,
      details: { recordId: record.id, fieldCount: Object.keys(bodyResult.data as Record<string, unknown>).length },
      ipAddress: getClientIp(req),
    });

    return new Response(JSON.stringify({
      id: record.id,
      data: typeof record.data === "string" ? JSON.parse(record.data) : record.data,
      created_at: String(record.created_at),
    }), { status: 201, headers: { "content-type": "application/json", ...corsHeaders } });
  }

  // PUT /api/v1/databases/:id/records/:recordId
  const putMatch = path.match(/^\/api\/v1\/databases\/([a-f0-9-]+)\/records\/([a-f0-9-]+)$/);
  if (putMatch && method === "PUT") {
    const dbId = putMatch[1];
    const recordId = putMatch[2];

    // 1. Validate UUIDs
    const dbUuidErr = requireUUID("database ID", dbId);
    if (dbUuidErr) return dbUuidErr;

    const recUuidErr = requireUUID("record ID", recordId);
    if (recUuidErr) return recUuidErr;

    // 2. Fetch the database schema
    const { fields, dbCheck, error: fieldsErr } = await getFieldsForDatabase(dbId);
    if (fieldsErr) return fieldsErr;

    // 3. Read and validate body size
    const bodyResult = await readJsonBody(req);
    if (!bodyResult.ok) {
      return jsonErr(400, bodyResult.error || "Invalid request body");
    }

    // 4. Validate record data against schema
    const validation = validateRecordData(bodyResult.data, fields);
    if (!validation.valid) {
      return jsonErr(400, "Validation failed", { details: validation.errors });
    }

    // 5. Update the record
    const [record] = await sql`
      UPDATE records SET data = ${JSON.stringify(bodyResult.data)}::jsonb, updated_at = NOW()
      WHERE id = ${recordId}::uuid AND database_id = ${dbId}::uuid
      RETURNING id, data, updated_at
    `;
    if (!record) {
      await logApiEvent(sql, {
        userId,
        eventType: "update_record_failed",
        resource: `databases/${dbId}/records/${recordId}`,
        details: { reason: "not_found" },
        ipAddress: getClientIp(req),
      });
      return jsonErr(404, "Record not found");
    }

    await logApiEvent(sql, {
      userId,
      eventType: "update_record",
      resource: `databases/${dbId}/records/${recordId}`,
      details: { recordId },
      ipAddress: getClientIp(req),
    });

    return new Response(JSON.stringify({
      id: record.id,
      data: typeof record.data === "string" ? JSON.parse(record.data) : record.data,
      updated_at: String(record.updated_at),
    }), { headers: { "content-type": "application/json", ...corsHeaders } });
  }

  // DELETE /api/v1/databases/:id/records/:recordId
  const deleteMatch = path.match(/^\/api\/v1\/databases\/([a-f0-9-]+)\/records\/([a-f0-9-]+)$/);
  if (deleteMatch && method === "DELETE") {
    const dbId = deleteMatch[1];
    const recordId = deleteMatch[2];

    // Validate UUIDs
    const dbUuidErr = requireUUID("database ID", dbId);
    if (dbUuidErr) return dbUuidErr;

    const recUuidErr = requireUUID("record ID", recordId);
    if (recUuidErr) return recUuidErr;

    // Verify the database exists
    const [dbCheck] = await sql`SELECT id FROM databases WHERE id = ${dbId}::uuid`;
    if (!dbCheck) {
      return jsonErr(404, `Database not found: ${dbId}`);
    }

    await sql`DELETE FROM records WHERE id = ${recordId}::uuid AND database_id = ${dbId}::uuid`;

    await logApiEvent(sql, {
      userId,
      eventType: "delete_record",
      resource: `databases/${dbId}/records/${recordId}`,
      details: { recordId },
      ipAddress: getClientIp(req),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }

  // Log unmatched route
  await logApiEvent(sql, {
    userId,
    eventType: "route_not_found",
    resource: path,
    details: { method },
    ipAddress: getClientIp(req),
  });

  return jsonErr(404, "Not found");
}

// ── Server ───────────────────────────────────────────────────────────────────

for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        const { pathname } = new URL(req.url);

        // Route API requests
        if (pathname.startsWith("/api/v1/")) {
          return handleApiRequest(req);
        }

        // Serve static files
        if (pathname !== "/") {
          const file = Bun.file(CLIENT_DIR + pathname);
          if (await file.exists()) {
            const res = new Response(file);
            // Only set Cache-Control for static assets, skip security headers
            if (pathname.startsWith("/assets/")) {
              res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
            }
            return res;
          }
        }

        // SSR for everything else — add security headers
        const ssrRes = await (
          handler as { fetch: (r: Request) => Response | Promise<Response> }
        ).fetch(req);
        const secured = addSecurityHeaders(ssrRes);
        secured.headers.set("Cache-Control", getCacheControl(pathname));
        return secured;
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}

console.log(`team-site serving on http://${HOST}:${String(PORT)}`);
