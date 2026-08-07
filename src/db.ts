import { createServerFn } from "@tanstack/react-start";
import { neon } from "@neondatabase/serverless";

/**
 * The Neon serverless SQL client for FinStruct.
 * Lazily resolves DATABASE_URL so the site builds before a database is connected.
 */
export const sql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — connect a database before running queries.",
    );
  }
  return neon(url);
};

/**
 * Initialize the FinStruct database schema.
 * Creates all required tables if they don't exist.
 * Safe to call multiple times.
 */
export const initSchema = createServerFn().handler(async () => {
  const db = sql();
  
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      subscription_tier TEXT NOT NULL DEFAULT 'free',
      subscription_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await db`
    CREATE TABLE IF NOT EXISTS databases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await db`
    CREATE TABLE IF NOT EXISTS fields (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'currency', 'boolean')),
      field_order INTEGER NOT NULL DEFAULT 0,
      config JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await db`
    CREATE TABLE IF NOT EXISTS records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_databases_user_id ON databases(user_id);
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_fields_database_id ON fields(database_id);
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_records_database_id ON records(database_id);
  `;

  // API keys table
  await db`
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      last_used_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      revoked BOOLEAN DEFAULT FALSE
    );
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
  `;

  // API logs table
  await db`
    CREATE TABLE IF NOT EXISTS api_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      event_type TEXT NOT NULL,
      resource TEXT NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      ip_address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_api_logs_event_type ON api_logs(event_type);
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
  `;

  return { success: true };
});

// ─── Logging Function ───────────────────────────────────────────────────────

export const logEvent = createServerFn()
  .validator((d: {
    userId?: string;
    eventType: string;
    resource: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    await db`
      INSERT INTO api_logs (user_id, event_type, resource, details, ip_address)
      VALUES (
        ${data.userId || null},
        ${data.eventType},
        ${data.resource},
        ${JSON.stringify(data.details || {})}::jsonb,
        ${data.ipAddress || null}
      )
    `;
    return { success: true };
  });

// ─── Subscription Functions ─────────────────────────────────────────────────

export const getUserSubscription = createServerFn()
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [user] = await db`
      SELECT subscription_tier, subscription_id FROM users WHERE id = ${data.userId}
    `;
    return {
      tier: user?.subscription_tier || "free",
      subscriptionId: user?.subscription_id || null,
    };
  });

export const checkDatabaseLimit = createServerFn()
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [user] = await db`
      SELECT subscription_tier FROM users WHERE id = ${data.userId}
    `;
    const tier = user?.subscription_tier || "free";
    if (tier !== "free") return { allowed: true, tier, current: 0, limit: Infinity };
    const [count] = await db`
      SELECT COUNT(*)::int as count FROM databases WHERE user_id = ${data.userId}
    `;
    const current = count?.count || 0;
    return { allowed: current < 1, tier, current, limit: 1 };
  });

export const checkRecordLimit = createServerFn()
  .validator((d: { userId: string; databaseId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [user] = await db`
      SELECT subscription_tier FROM users WHERE id = ${data.userId}
    `;
    const tier = user?.subscription_tier || "free";
    if (tier !== "free") return { allowed: true, tier, current: 0, limit: Infinity };
    const [count] = await db`
      SELECT COUNT(*)::int as count FROM records WHERE database_id = ${data.databaseId}::uuid
    `;
    const current = count?.count || 0;
    return { allowed: current < 100, tier, current, limit: 100 };
  });

export const upgradeUserTier = createServerFn()
  .validator((d: { userId: string; tier: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [user] = await db`
      UPDATE users SET subscription_tier = ${data.tier}, updated_at = NOW()
      WHERE id = ${data.userId}
      RETURNING subscription_tier, subscription_id
    `;
    return { tier: user.subscription_tier, success: true };
  });

// ─── API Key Functions ──────────────────────────────────────────────────────

export const generateApiKey = createServerFn()
  .validator((d: { userId: string; name: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [user] = await db`
      SELECT subscription_tier FROM users WHERE id = ${data.userId}
    `;
    const tier = user?.subscription_tier || "free";
    if (tier === "free") throw new Error("API access requires a Pro or Team subscription");
    
    const crypto = await import("node:crypto");
    const rawKey = "fs_" + crypto.randomBytes(24).toString("hex");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 12);

    const [row] = await db`
      INSERT INTO api_keys (user_id, name, key_hash, key_prefix)
      VALUES (${data.userId}, ${data.name}, ${keyHash}, ${keyPrefix})
      RETURNING id, name, key_prefix, created_at
    `;

    // Log the key generation
    try {
      await db`
        INSERT INTO api_logs (user_id, event_type, resource, details)
        VALUES (
          ${data.userId},
          'api_key_generated',
          'api_keys',
          ${JSON.stringify({ keyId: row.id, keyName: data.name })}::jsonb
        )
      `;
    } catch { /* Logging is best-effort */ }

    return { ...row, rawKey, created_at: String(row.created_at) };
  });

export const revokeApiKey = createServerFn()
  .validator((d: { userId: string; keyId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [row] = await db`
      UPDATE api_keys SET revoked = TRUE WHERE id = ${data.keyId}::uuid AND user_id = ${data.userId}
      RETURNING id, name
    `;

    // Log the key revocation
    if (row) {
      try {
        await db`
          INSERT INTO api_logs (user_id, event_type, resource, details)
          VALUES (
            ${data.userId},
            'api_key_revoked',
            'api_keys',
            ${JSON.stringify({ keyId: data.keyId, keyName: row.name })}::jsonb
          )
        `;
      } catch { /* Logging is best-effort */ }
    }

    return { success: true };
  });

export const listApiKeys = createServerFn()
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const rows = await db`
      SELECT id, name, key_prefix, last_used_at, created_at, revoked
      FROM api_keys
      WHERE user_id = ${data.userId}
      ORDER BY created_at DESC
    `;
    return rows.map((r: any) => ({
      ...r,
      last_used_at: r.last_used_at ? String(r.last_used_at) : null,
      created_at: String(r.created_at),
    }));
  });

export const validateApiKey = createServerFn()
  .validator((d: { apiKey: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const crypto = await import("node:crypto");
    const keyHash = crypto.createHash("sha256").update(data.apiKey).digest("hex");
    const [key] = await db`
      SELECT id, user_id, revoked FROM api_keys WHERE key_hash = ${keyHash}
    `;
    if (!key || key.revoked) return { valid: false, userId: null };
    await db`UPDATE api_keys SET last_used_at = NOW() WHERE id = ${key.id}::uuid`;
    return { valid: true, userId: key.user_id };
  });

// ─── Server Functions ─────────────────────────────────────────────────────

export const upsertUser = createServerFn()
  .validator((d: { id: string; email: string; name?: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    // Check if user already exists
    const [existing] = await db`
      SELECT id FROM users WHERE id = ${data.id}
    `;
    const isNewUser = !existing;

    await db`
      INSERT INTO users (id, email, name)
      VALUES (${data.id}, ${data.email}, ${data.name || null})
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        updated_at = NOW()
    `;
    return { success: true, isNewUser };
  });

export const getUserDatabases = createServerFn()
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const rows = await db`
      SELECT id, name, description, created_at
      FROM databases
      WHERE user_id = ${data.userId}
      ORDER BY created_at DESC
    `;
    return rows.map((r) => ({
      ...r,
      created_at: String(r.created_at),
    }));
  });

export const createDatabase = createServerFn()
  .validator((d: { userId: string; name: string; description?: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [row] = await db`
      INSERT INTO databases (user_id, name, description)
      VALUES (${data.userId}, ${data.name}, ${data.description || ""})
      RETURNING id, name, description, created_at
    `;
    return { ...row, created_at: String(row.created_at) };
  });

export const deleteDatabase = createServerFn()
  .validator((d: { databaseId: string; userId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    await db`
      DELETE FROM databases WHERE id = ${data.databaseId}::uuid AND user_id = ${data.userId}
    `;
    return { success: true };
  });

export const getFields = createServerFn()
  .validator((d: { databaseId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const rows = await db`
      SELECT id, name, type, field_order, config
      FROM fields
      WHERE database_id = ${data.databaseId}::uuid
      ORDER BY field_order ASC
    `;
    return rows.map((r) => ({
      ...r,
      config: typeof r.config === "string" ? JSON.parse(r.config) : r.config,
    }));
  });

export const addField = createServerFn()
  .validator((d: {
    databaseId: string;
    name: string;
    type: string;
    fieldOrder: number;
    config?: Record<string, unknown>;
  }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [row] = await db`
      INSERT INTO fields (database_id, name, type, field_order, config)
      VALUES (${data.databaseId}::uuid, ${data.name}, ${data.type}, ${data.fieldOrder}, ${JSON.stringify(data.config || {})}::jsonb)
      RETURNING id, name, type, field_order, config
    `;
    return {
      ...row,
      config: typeof row.config === "string" ? JSON.parse(row.config) : row.config,
    };
  });

export const deleteField = createServerFn()
  .validator((d: { fieldId: string; databaseId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    await db`
      DELETE FROM fields WHERE id = ${data.fieldId}::uuid AND database_id = ${data.databaseId}::uuid
    `;
    return { success: true };
  });

export const getRecords = createServerFn()
  .validator((d: { databaseId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const rows = await db`
      SELECT id, data, created_at, updated_at
      FROM records
      WHERE database_id = ${data.databaseId}::uuid
      ORDER BY created_at DESC
    `;
    return rows.map((r) => ({
      id: r.id,
      data: typeof r.data === "string" ? JSON.parse(r.data) : r.data,
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    }));
  });

export const addRecord = createServerFn()
  .validator((d: { databaseId: string; data: Record<string, unknown> }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [row] = await db`
      INSERT INTO records (database_id, data)
      VALUES (${data.databaseId}::uuid, ${JSON.stringify(data.data)}::jsonb)
      RETURNING id, data, created_at
    `;
    return {
      id: row.id,
      data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
      created_at: String(row.created_at),
    };
  });

export const updateRecord = createServerFn()
  .validator((d: { recordId: string; data: Record<string, unknown> }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [row] = await db`
      UPDATE records
      SET data = ${JSON.stringify(data.data)}::jsonb, updated_at = NOW()
      WHERE id = ${data.recordId}::uuid
      RETURNING id, data, updated_at
    `;
    return {
      id: row.id,
      data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
      updated_at: String(row.updated_at),
    };
  });

export const deleteRecord = createServerFn()
  .validator((d: { recordId: string; databaseId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    await db`
      DELETE FROM records WHERE id = ${data.recordId}::uuid AND database_id = ${data.databaseId}::uuid
    `;
    return { success: true };
  });

export const exportCSV = createServerFn()
  .validator((d: { databaseId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const [dbInfo] = await db`
      SELECT name FROM databases WHERE id = ${data.databaseId}::uuid
    `;
    const fields = await db`
      SELECT name FROM fields WHERE database_id = ${data.databaseId}::uuid ORDER BY field_order ASC
    `;
    const records = await db`
      SELECT data FROM records WHERE database_id = ${data.databaseId}::uuid ORDER BY created_at DESC
    `;

    const fieldNames = fields.map((f: { name: string }) => f.name);
    const header = fieldNames.join(",");
    const rows = records.map((r: { data: string | Record<string, unknown> }) => {
      const d = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      return fieldNames.map((n: string) => {
        const val = d[n];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(",");
    });

    return {
      filename: `${(dbInfo as { name: string }).name || "export"}.csv`,
      content: [header, ...rows].join("\n"),
    };
  });

// ─── Template Databases ─────────────────────────────────────────────────────

export const TEMPLATES = [
  {
    id: "personal-budget",
    name: "Personal Budget",
    description: "Track your monthly income and expenses with categories and recurring flags.",
    icon: "💰",
    fields: [
      { name: "Category", type: "select", fieldOrder: 0, config: { options: ["Food", "Housing", "Transport", "Utilities", "Entertainment", "Shopping", "Health", "Other"] } },
      { name: "Amount", type: "currency", fieldOrder: 1, config: {} },
      { name: "Date", type: "date", fieldOrder: 2, config: {} },
      { name: "Description", type: "text", fieldOrder: 3, config: {} },
      { name: "Recurring", type: "boolean", fieldOrder: 4, config: {} },
    ],
    records: [
      { Category: "Housing", Amount: 1800, Date: "2026-07-01", Description: "Monthly rent", Recurring: true },
      { Category: "Food", Amount: 85.50, Date: "2026-07-02", Description: "Grocery run at Whole Foods", Recurring: false },
      { Category: "Transport", Amount: 45.00, Date: "2026-07-03", Description: "Gas station fill-up", Recurring: false },
      { Category: "Utilities", Amount: 120.00, Date: "2026-07-05", Description: "Electric bill", Recurring: true },
      { Category: "Entertainment", Amount: 15.99, Date: "2026-07-06", Description: "Netflix subscription", Recurring: true },
      { Category: "Food", Amount: 52.30, Date: "2026-07-08", Description: "Dinner at Italian place", Recurring: false },
      { Category: "Shopping", Amount: 89.99, Date: "2026-07-10", Description: "New running shoes", Recurring: false },
      { Category: "Utilities", Amount: 65.00, Date: "2026-07-12", Description: "Internet bill", Recurring: true },
      { Category: "Health", Amount: 30.00, Date: "2026-07-15", Description: "Gym membership", Recurring: true },
      { Category: "Entertainment", Amount: 12.99, Date: "2026-07-18", Description: "Spotify premium", Recurring: true },
    ],
  },
  {
    id: "business-expenses",
    name: "Business Expenses",
    description: "Log business expenses for tax time. Track vendors, categories, and deductibility.",
    icon: "💼",
    fields: [
      { name: "Vendor", type: "text", fieldOrder: 0, config: {} },
      { name: "Amount", type: "currency", fieldOrder: 1, config: {} },
      { name: "Category", type: "select", fieldOrder: 2, config: { options: ["Office Supplies", "Travel", "Software", "Meals", "Services", "Equipment", "Other"] } },
      { name: "Date", type: "date", fieldOrder: 3, config: {} },
      { name: "Receipt", type: "text", fieldOrder: 4, config: {} },
      { name: "Tax Deductible", type: "boolean", fieldOrder: 5, config: {} },
    ],
    records: [
      { Vendor: "Amazon Business", Amount: 299.00, Category: "Office Supplies", Date: "2026-07-02", Receipt: "INV-2026-001", "Tax Deductible": true },
      { Vendor: "Delta Airlines", Amount: 450.00, Category: "Travel", Date: "2026-07-05", Receipt: "E-TKT-4521", "Tax Deductible": true },
      { Vendor: "Slack", Amount: 15.00, Category: "Software", Date: "2026-07-06", Receipt: "SUB-88723", "Tax Deductible": true },
      { Vendor: "WeWork", Amount: 500.00, Category: "Services", Date: "2026-07-01", Receipt: "INV-WEW-07", "Tax Deductible": true },
      { Vendor: "Staples", Amount: 87.50, Category: "Office Supplies", Date: "2026-07-08", Receipt: "REC-7721", "Tax Deductible": true },
      { Vendor: "Client Lunch", Amount: 68.00, Category: "Meals", Date: "2026-07-10", Receipt: "—", "Tax Deductible": true },
      { Vendor: "Apple Store", Amount: 1299.00, Category: "Equipment", Date: "2026-07-12", Receipt: "INV-APL-992", "Tax Deductible": true },
      { Vendor: "AWS", Amount: 234.56, Category: "Software", Date: "2026-07-15", Receipt: "AWS-07-2026", "Tax Deductible": true },
    ],
  },
  {
    id: "investment-portfolio",
    name: "Investment Portfolio",
    description: "Monitor your stock holdings, buy prices, and current values across sectors.",
    icon: "📈",
    fields: [
      { name: "Ticker", type: "text", fieldOrder: 0, config: {} },
      { name: "Shares", type: "number", fieldOrder: 1, config: {} },
      { name: "Buy Price", type: "currency", fieldOrder: 2, config: {} },
      { name: "Current Price", type: "currency", fieldOrder: 3, config: {} },
      { name: "Buy Date", type: "date", fieldOrder: 4, config: {} },
      { name: "Sector", type: "select", fieldOrder: 5, config: { options: ["Tech", "Healthcare", "Finance", "Energy", "Consumer", "Industrial", "Other"] } },
    ],
    records: [
      { Ticker: "AAPL", Shares: 50, "Buy Price": 150.00, "Current Price": 178.50, "Buy Date": "2026-01-15", Sector: "Tech" },
      { Ticker: "MSFT", Shares: 30, "Buy Price": 280.00, "Current Price": 310.20, "Buy Date": "2026-02-10", Sector: "Tech" },
      { Ticker: "JPM", Shares: 40, "Buy Price": 145.00, "Current Price": 162.80, "Buy Date": "2026-03-05", Sector: "Finance" },
      { Ticker: "JNJ", Shares: 25, "Buy Price": 165.00, "Current Price": 158.00, "Buy Date": "2026-01-20", Sector: "Healthcare" },
      { Ticker: "XOM", Shares: 60, "Buy Price": 95.00, "Current Price": 108.40, "Buy Date": "2026-04-01", Sector: "Energy" },
      { Ticker: "AMZN", Shares: 15, "Buy Price": 3450.00, "Current Price": 3620.00, "Buy Date": "2026-02-28", Sector: "Consumer" },
      { Ticker: "NVDA", Shares: 20, "Buy Price": 420.00, "Current Price": 510.00, "Buy Date": "2026-05-10", Sector: "Tech" },
    ],
  },
  {
    id: "freelance-invoices",
    name: "Freelance Invoices",
    description: "Track invoices sent to clients with status, amounts, and payment dates.",
    icon: "🧾",
    fields: [
      { name: "Client", type: "text", fieldOrder: 0, config: {} },
      { name: "Amount", type: "currency", fieldOrder: 1, config: {} },
      { name: "Status", type: "select", fieldOrder: 2, config: { options: ["Sent","Paid","Overdue","Draft"] } },
      { name: "Issue Date", type: "date", fieldOrder: 3, config: {} },
      { name: "Due Date", type: "date", fieldOrder: 4, config: {} },
    ],
    records: [
      { Client: "Acme Corp", Amount: 2500.00, Status: "Paid", "Issue Date": "2026-07-01", "Due Date": "2026-07-30" },
      { Client: "Widgets Inc", Amount: 1200.00, Status: "Sent", "Issue Date": "2026-07-10", "Due Date": "2026-08-09" },
      { Client: "Startup LLC", Amount: 5000.00, Status: "Overdue", "Issue Date": "2026-06-15", "Due Date": "2026-07-15" },
      { Client: "Design Co", Amount: 850.00, Status: "Paid", "Issue Date": "2026-07-05", "Due Date": "2026-07-25" },
      { Client: "Tech Partners", Amount: 3200.00, Status: "Draft", "Issue Date": "2026-07-20", "Due Date": "2026-08-19" },
      { Client: "Agency XYZ", Amount: 1800.00, Status: "Sent", "Issue Date": "2026-07-15", "Due Date": "2026-08-14" },
    ],
  },
  {
    id: "rental-income",
    name: "Rental Income",
    description: "Track rental property income, expenses, and tenant details per unit.",
    icon: "🏠",
    fields: [
      { name: "Property", type: "text", fieldOrder: 0, config: {} },
      { name: "Tenant", type: "text", fieldOrder: 1, config: {} },
      { name: "Rent", type: "currency", fieldOrder: 2, config: {} },
      { name: "Expenses", type: "currency", fieldOrder: 3, config: {} },
      { name: "Date", type: "date", fieldOrder: 4, config: {} },
      { name: "Paid", type: "boolean", fieldOrder: 5, config: {} },
    ],
    records: [
      { Property: "123 Main St", Tenant: "John Smith", Rent: 2200.00, Expenses: 350.00, Date: "2026-07-01", Paid: true },
      { Property: "456 Oak Ave", Tenant: "Jane Doe", Rent: 1800.00, Expenses: 200.00, Date: "2026-07-01", Paid: true },
      { Property: "789 Pine Rd", Tenant: "Bob Wilson", Rent: 1500.00, Expenses: 450.00, Date: "2026-07-01", Paid: false },
      { Property: "123 Main St", Tenant: "John Smith", Rent: 2200.00, Expenses: 180.00, Date: "2026-08-01", Paid: true },
      { Property: "456 Oak Ave", Tenant: "Jane Doe", Rent: 1800.00, Expenses: 300.00, Date: "2026-08-01", Paid: true },
      { Property: "321 Elm St", Tenant: "Alice Brown", Rent: 2600.00, Expenses: 250.00, Date: "2026-08-01", Paid: true },
    ],
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    description: "Track all your recurring subscriptions, renewal dates, and monthly costs.",
    icon: "🔁",
    fields: [
      { name: "Service", type: "text", fieldOrder: 0, config: {} },
      { name: "Cost", type: "currency", fieldOrder: 1, config: {} },
      { name: "Category", type: "select", fieldOrder: 2, config: { options: ["Productivity","Entertainment","Cloud","News","Fitness","Other"] } },
      { name: "Billing Cycle", type: "select", fieldOrder: 3, config: { options: ["Monthly","Annual","Weekly","Quarterly"] } },
      { name: "Next Renewal", type: "date", fieldOrder: 4, config: {} },
    ],
    records: [
      { Service: "Netflix", Cost: 15.99, Category: "Entertainment", "Billing Cycle": "Monthly", "Next Renewal": "2026-08-15" },
      { Service: "Spotify", Cost: 12.99, Category: "Entertainment", "Billing Cycle": "Monthly", "Next Renewal": "2026-08-10" },
      { Service: "AWS", Cost: 89.00, Category: "Cloud", "Billing Cycle": "Monthly", "Next Renewal": "2026-08-01" },
      { Service: "Notion", Cost: 10.00, Category: "Productivity", "Billing Cycle": "Monthly", "Next Renewal": "2026-08-22" },
      { Service: "New York Times", Cost: 8.00, Category: "News", "Billing Cycle": "Monthly", "Next Renewal": "2026-08-05" },
      { Service: "Adobe Creative Cloud", Cost: 59.99, Category: "Productivity", "Billing Cycle": "Monthly", "Next Renewal": "2026-08-18" },
      { Service: "Peloton", Cost: 44.00, Category: "Fitness", "Billing Cycle": "Monthly", "Next Renewal": "2026-08-25" },
      { Service: "GitHub Pro", Cost: 4.00, Category: "Productivity", "Billing Cycle": "Monthly", "Next Renewal": "2026-08-12" },
    ],
  },
];

export const createDatabaseFromTemplate = createServerFn()
  .validator((d: { userId: string; templateId: string }) => d)
  .handler(async ({ data }) => {
    const db = sql();
    const template = TEMPLATES.find((t) => t.id === data.templateId);
    if (!template) throw new Error("Template not found");

    // Create the database
    const [dbRow] = await db`
      INSERT INTO databases (user_id, name, description)
      VALUES (${data.userId}, ${template.name}, ${template.description})
      RETURNING id, name, description, created_at
    `;
    const databaseId = dbRow.id;

    // Create fields
    for (const field of template.fields) {
      await db`
        INSERT INTO fields (database_id, name, type, field_order, config)
        VALUES (${databaseId}::uuid, ${field.name}, ${field.type}, ${field.fieldOrder}, ${JSON.stringify(field.config)}::jsonb)
      `;
    }

    // Create sample records
    for (const record of template.records) {
      await db`
        INSERT INTO records (database_id, data)
        VALUES (${databaseId}::uuid, ${JSON.stringify(record)}::jsonb)
      `;
    }

    return { ...dbRow, created_at: String(dbRow.created_at) };
  });