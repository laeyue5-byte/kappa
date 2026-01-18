import { pgTable, serial, text, decimal, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Status enum values
export const memberStatusValues = ['active', 'inactive', 'deceased'] as const;
export type MemberStatus = typeof memberStatusValues[number];

// ============================================
// MEMBERS TABLE
// ============================================
export const members = pgTable('members', {
    id: serial('id').primaryKey(),
    lastName: text('last_name').notNull(),
    firstName: text('first_name').notNull(),
    status: text('status').$type<MemberStatus>().default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// PERIODS TABLE (Monthly Meetings)
// ============================================
export const periods = pgTable('periods', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(), // e.g., "JAN-FEB 2025"
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    isClosed: boolean('is_closed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// LEDGER ENTRIES TABLE
// ============================================
export const ledgerEntries = pgTable('ledger_entries', {
    id: serial('id').primaryKey(),
    memberId: integer('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
    periodId: integer('period_id').references(() => periods.id, { onDelete: 'cascade' }).notNull(),

    // Financial Fields (stored as decimal for precision)
    lawas: decimal('lawas', { precision: 12, scale: 2 }).default('0').notNull(),        // Attendance/Share
    putUp: decimal('put_up', { precision: 12, scale: 2 }).default('0').notNull(),       // Savings
    hulamPutUp: decimal('hulam_put_up', { precision: 12, scale: 2 }).default('0').notNull(), // Loan from Savings
    hulam: decimal('hulam', { precision: 12, scale: 2 }).default('0').notNull(),        // Loan Principal
    interest: decimal('interest', { precision: 12, scale: 2 }).default('0').notNull(),  // Auto: 10% of Hulam
    payment: decimal('payment', { precision: 12, scale: 2 }).default('0').notNull(),    // Payment made
    penalty: decimal('penalty', { precision: 12, scale: 2 }).default('0').notNull(),    // Penalty

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================
export const membersRelations = relations(members, ({ many }) => ({
    ledgerEntries: many(ledgerEntries),
}));

export const periodsRelations = relations(periods, ({ many }) => ({
    ledgerEntries: many(ledgerEntries),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
    member: one(members, {
        fields: [ledgerEntries.memberId],
        references: [members.id],
    }),
    period: one(periods, {
        fields: [ledgerEntries.periodId],
        references: [periods.id],
    }),
}));

// ============================================
// TYPE EXPORTS
// ============================================
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

export type Period = typeof periods.$inferSelect;
export type NewPeriod = typeof periods.$inferInsert;

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
