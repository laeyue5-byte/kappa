// One-time script to undo bulk interest payments
// Run with: npx tsx scripts/undo-bulk-interest.ts

import 'dotenv/config';
import { db, schema } from '../src/lib/db';
import { eq } from 'drizzle-orm';

const { ledgerEntries } = schema;

async function undoBulkInterestPayments() {
    console.log('Starting undo of bulk interest payments...\n');

    // Get all periods first
    const periods = await db.query.periods.findMany({
        orderBy: (p, { desc }) => [desc(p.startDate)],
    });

    console.log('Available periods:');
    periods.forEach(p => {
        console.log(`  ID: ${p.id} - ${p.name}`);
    });

    // Get the most recent period (most likely where bulk payments were made)
    const recentPeriod = periods[0];
    if (!recentPeriod) {
        console.log('\nNo periods found!');
        return;
    }

    console.log(`\nChecking period: ${recentPeriod.name} (ID: ${recentPeriod.id})`);

    // Find all entries in this period
    const allEntries = await db.query.ledgerEntries.findMany({
        where: eq(ledgerEntries.periodId, recentPeriod.id),
    });

    // Filter to find payment-only entries
    const paymentOnlyEntries = allEntries.filter(entry =>
        parseFloat(entry.lawas.toString()) === 0 &&
        parseFloat(entry.putUp) === 0 &&
        parseFloat(entry.hulamPutUp) === 0 &&
        parseFloat(entry.hulam) === 0 &&
        parseFloat(entry.interest) === 0 &&
        parseFloat(entry.payment) > 0 &&
        parseFloat(entry.penalty) === 0
    );

    console.log(`\nFound ${paymentOnlyEntries.length} payment-only entries (likely from 'Pay All Interest')`);

    if (paymentOnlyEntries.length === 0) {
        console.log('Nothing to delete.');
        return;
    }

    const totalPayment = paymentOnlyEntries.reduce((acc, e) => acc + parseFloat(e.payment), 0);
    console.log(`Total payment amount: ₱${totalPayment.toFixed(2)}`);

    console.log('\nDeleting entries...');

    for (const entry of paymentOnlyEntries) {
        await db.delete(ledgerEntries).where(eq(ledgerEntries.id, entry.id));
        console.log(`  Deleted entry ID: ${entry.id} (₱${entry.payment})`);
    }

    console.log(`\n✅ Done! Deleted ${paymentOnlyEntries.length} entries.`);
    process.exit(0);
}

undoBulkInterestPayments().catch(console.error);
