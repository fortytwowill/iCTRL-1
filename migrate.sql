-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    CREATE TYPE abc_classification AS ENUM ('A', 'B', 'C');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE entry_type AS ENUM ('in', 'out', 'adjustment', 'transfer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('master_admin', 'admin', 'user', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Better Auth Tables
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT false NOT NULL,
    image TEXT,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    role TEXT,
    banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    ban_expires TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    active_organization_id TEXT,
    impersonated_by TEXT
);

CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP,
    refresh_token_expires_at TIMESTAMP,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "organization" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS "member" (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invitation" (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    inviter_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- App Tables
CREATE TABLE IF NOT EXISTS "categories" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vendors" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "locations" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "items" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES "categories"(id),
    location_id UUID REFERENCES "locations"(id),
    vendor_id UUID REFERENCES "vendors"(id),
    quantity INTEGER DEFAULT 0 NOT NULL,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    unit_price NUMERIC,
    abc_classification abc_classification,
    is_serialized BOOLEAN DEFAULT false,
    is_batched BOOLEAN DEFAULT false,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "items_sku_org_uidx" ON "items"(sku, organization_id);

CREATE TABLE IF NOT EXISTS "profiles" (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    full_name TEXT,
    avatar_url TEXT,
    organization_id TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    status TEXT DEFAULT 'active',
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "settings" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    value JSONB,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "settings_key_org_uidx" ON "settings"(key, organization_id);

CREATE TABLE IF NOT EXISTS "transaction_logs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES "items"(id),
    type entry_type NOT NULL,
    quantity INTEGER NOT NULL,
    reference TEXT,
    notes TEXT,
    performed_by TEXT REFERENCES "user"(id),
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_alerts" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES "items"(id),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "serial_numbers" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES "items"(id),
    serial TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    location_id UUID REFERENCES "locations"(id),
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "serials_item_serial_uidx" ON "serial_numbers"(item_id, serial);

CREATE TABLE IF NOT EXISTS "batch_lots" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES "items"(id),
    lot_number TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    expiry_date TIMESTAMP,
    location_id UUID REFERENCES "locations"(id),
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "batches_item_lot_uidx" ON "batch_lots"(item_id, lot_number);

CREATE TABLE IF NOT EXISTS "item_bundles" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "bundles_sku_org_uidx" ON "item_bundles"(sku, organization_id);

CREATE TABLE IF NOT EXISTS "personnel" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    phone TEXT,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "purchase_orders" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL,
    vendor_id UUID NOT NULL REFERENCES "vendors"(id),
    status TEXT DEFAULT 'draft',
    total_amount NUMERIC,
    notes TEXT,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "pos_number_org_uidx" ON "purchase_orders"(po_number, organization_id);

CREATE TABLE IF NOT EXISTS "po_line_items" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES "purchase_orders"(id),
    item_id UUID NOT NULL REFERENCES "items"(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC,
    received_quantity INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "scheduled_reports" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    schedule TEXT NOT NULL,
    recipients JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bug_reports" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    reported_by TEXT REFERENCES "user"(id),
    screenshot_url TEXT,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "platform_admin_audit_log" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details JSONB,
    performed_by TEXT REFERENCES "user"(id),
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);