import { relations } from "drizzle-orm";
import {
 pgTable,
 text,
 timestamp,
 boolean,
 integer,
 numeric,
 jsonb,
 index,
 uniqueIndex,
 pgEnum,
 uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

// ─── Enums ────────────────────────────────────────────────────────────────────
export const abcClassificationEnum = pgEnum("abc_classification", ["A", "B", "C"]);
export const entryTypeEnum = pgEnum("entry_type", ["in", "out", "adjustment", "transfer"]);
export const userRoleEnum = pgEnum("user_role", ["master_admin", "admin", "user", "viewer"]);

// ─── App Tables ───────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
 id: uuid("id").primaryKey().defaultRandom(),
 name: text("name").notNull(),
 description: text("description"),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vendors = pgTable("vendors", {
 id: uuid("id").primaryKey().defaultRandom(),
 name: text("name").notNull(),
 contactPerson: text("contact_person"),
 email: text("email"),
 phone: text("phone"),
 address: text("address"),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const locations = pgTable("locations", {
 id: uuid("id").primaryKey().defaultRandom(),
 name: text("name").notNull(),
 code: text("code"),
 description: text("description"),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
 id: uuid("id").primaryKey().defaultRandom(),
 sku: text("sku").notNull(),
 name: text("name").notNull(),
 description: text("description"),
 categoryId: text("category_id").references(() => categories.id),
 locationId: text("location_id").references(() => locations.id),
 vendorId: text("vendor_id").references(() => vendors.id),
 quantity: integer("quantity").default(0).notNull(),
 minStock: integer("min_stock").default(0),
 maxStock: integer("max_stock"),
 unitPrice: numeric("unit_price"),
 abcClassification: abcClassificationEnum("abc_classification"),
 isSerialized: boolean("is_serialized").default(false),
 isBatched: boolean("is_batched").default(false),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
 index("items_org_idx").on(table.organizationId),
 uniqueIndex("items_sku_org_uidx").on(table.sku, table.organizationId),
]);

export const profiles = pgTable("profiles", {
 id: text("id").primaryKey(),
 userId: text("user_id").notNull().references(() => user.id),
 fullName: text("full_name"),
 avatarUrl: text("avatar_url"),
 organizationId: text("organization_id"),
 role: userRoleEnum("role").default("user"),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
 id: uuid("id").primaryKey().defaultRandom(),
 name: text("name").notNull(),
 code: text("code"),
 description: text("description"),
 status: text("status").default("active"),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
 id: uuid("id").primaryKey().defaultRandom(),
 key: text("key").notNull(),
 value: jsonb("value"),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
 uniqueIndex("settings_key_org_uidx").on(table.key, table.organizationId),
]);

export const transactionLogs = pgTable("transaction_logs", {
 id: uuid("id").primaryKey().defaultRandom(),
 itemId: text("item_id").notNull().references(() => items.id),
 type: entryTypeEnum("type").notNull(),
 quantity: integer("quantity").notNull(),
 reference: text("reference"),
 notes: text("notes"),
 performedBy: text("performed_by").references(() => user.id),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventoryAlerts = pgTable("inventory_alerts", {
 id: uuid("id").primaryKey().defaultRandom(),
 itemId: text("item_id").notNull().references(() => items.id),
 type: text("type").notNull(),
 message: text("message").notNull(),
 isResolved: boolean("is_resolved").default(false),
 resolvedAt: timestamp("resolved_at"),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serialNumbers = pgTable("serial_numbers", {
 id: uuid("id").primaryKey().defaultRandom(),
 itemId: text("item_id").notNull().references(() => items.id),
 serial: text("serial").notNull(),
 status: text("status").default("available"),
 locationId: text("location_id").references(() => locations.id),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
 uniqueIndex("serials_item_serial_uidx").on(table.itemId, table.serial),
]);

export const batchLots = pgTable("batch_lots", {
 id: uuid("id").primaryKey().defaultRandom(),
 itemId: text("item_id").notNull().references(() => items.id),
 lotNumber: text("lot_number").notNull(),
 quantity: integer("quantity").notNull(),
 expiryDate: timestamp("expiry_date"),
 locationId: text("location_id").references(() => locations.id),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
 uniqueIndex("batches_item_lot_uidx").on(table.itemId, table.lotNumber),
]);

export const itemBundles = pgTable("item_bundles", {
 id: uuid("id").primaryKey().defaultRandom(),
 name: text("name").notNull(),
 sku: text("sku").notNull(),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
 uniqueIndex("bundles_sku_org_uidx").on(table.sku, table.organizationId),
]);

export const personnel = pgTable("personnel", {
 id: uuid("id").primaryKey().defaultRandom(),
 name: text("name").notNull(),
 role: text("role"),
 email: text("email"),
 phone: text("phone"),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
 id: uuid("id").primaryKey().defaultRandom(),
 poNumber: text("po_number").notNull(),
 vendorId: text("vendor_id").notNull().references(() => vendors.id),
 status: text("status").default("draft"),
 totalAmount: numeric("total_amount"),
 notes: text("notes"),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
 uniqueIndex("pos_number_org_uidx").on(table.poNumber, table.organizationId),
]);

export const poLineItems = pgTable("po_line_items", {
 id: uuid("id").primaryKey().defaultRandom(),
 purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrders.id),
 itemId: text("item_id").notNull().references(() => items.id),
 quantity: integer("quantity").notNull(),
 unitPrice: numeric("unit_price"),
 receivedQuantity: integer("received_quantity").default(0),
});

export const scheduledReports = pgTable("scheduled_reports", {
 id: uuid("id").primaryKey().defaultRandom(),
 name: text("name").notNull(),
 type: text("type").notNull(),
 schedule: text("schedule").notNull(),
 recipients: jsonb("recipients").notNull(),
 isActive: boolean("is_active").default(true),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bugReports = pgTable("bug_reports", {
 id: uuid("id").primaryKey().defaultRandom(),
 title: text("title").notNull(),
 description: text("description"),
 severity: text("severity").default("medium"),
 status: text("status").default("open"),
 reportedBy: text("reported_by").references(() => user.id),
 screenshotUrl: text("screenshot_url"),
 organizationId: text("organization_id").notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const platformAdminAuditLog = pgTable("platform_admin_audit_log", {
 id: uuid("id").primaryKey().defaultRandom(),
 action: text("action").notNull(),
 details: jsonb("details"),
 performedBy: text("performed_by").references(() => user.id),
 ipAddress: text("ip_address"),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const itemsRelations = relations(items, ({ one, many }) => ({
 category: one(categories, { fields: [items.categoryId], references: [categories.id] }),
 location: one(locations, { fields: [items.locationId], references: [locations.id] }),
 vendor: one(vendors, { fields: [items.vendorId], references: [vendors.id] }),
 transactions: many(transactionLogs),
 alerts: many(inventoryAlerts),
 serials: many(serialNumbers),
 batches: many(batchLots),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
 items: many(items),
 purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
 vendor: one(vendors, { fields: [purchaseOrders.vendorId], references: [vendors.id] }),
 lineItems: many(poLineItems),
}));

export const poLineItemsRelations = relations(poLineItems, ({ one }) => ({
 purchaseOrder: one(purchaseOrders, { fields: [poLineItems.purchaseOrderId], references: [purchaseOrders.id] }),
 item: one(items, { fields: [poLineItems.itemId], references: [items.id] }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
 user: one(user, { fields: [profiles.userId], references: [user.id] }),
}));

export const transactionLogsRelations = relations(transactionLogs, ({ one }) => ({
 item: one(items, { fields: [transactionLogs.itemId], references: [items.id] }),
 performedByUser: one(user, { fields: [transactionLogs.performedBy], references: [user.id] }),
}));
