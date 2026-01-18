// Recovery script to copy data from Neon recovery branch to main branch
// Run with: npx tsx scripts/recover-from-backup.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

// Recovery branch (the backup with your deleted data)
const RECOVERY_DB_URL = 'postgresql://neondb_owner:npg_wDKr6E2ydWTI@ep-shy-darkness-a14nb4ss-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Main branch (your current database - from .env.local)
const MAIN_DB_URL = process.env.DATABASE_URL!;

async function recoverData() {
    console.log('🔄 Starting recovery from backup branch...\n');

    // Connect to both databases
    const recoveryDb = neon(RECOVERY_DB_URL);
    const mainDb = neon(MAIN_DB_URL);

    try {
        // 1. Get periods from recovery branch
        console.log('📋 Fetching periods from recovery branch...');
        const recoveryPeriods = await recoveryDb`SELECT * FROM periods ORDER BY id`;
        console.log(`   Found ${recoveryPeriods.length} periods in recovery branch`);

        // Get periods from main branch
        const mainPeriods = await mainDb`SELECT * FROM periods ORDER BY id`;
        console.log(`   Found ${mainPeriods.length} periods in main branch`);

        // Find periods that exist in recovery but not in main
        const mainPeriodIds = new Set(mainPeriods.map(p => p.id));
        const missingPeriods = recoveryPeriods.filter(p => !mainPeriodIds.has(p.id));
        console.log(`   Missing periods to restore: ${missingPeriods.length}`);

        if (missingPeriods.length > 0) {
            console.log('\n📥 Restoring missing periods...');
            for (const period of missingPeriods) {
                console.log(`   Restoring period: ${period.name} (ID: ${period.id})`);
                await mainDb`
                    INSERT INTO periods (id, name, start_date, end_date, is_closed, created_at)
                    VALUES (${period.id}, ${period.name}, ${period.start_date}, ${period.end_date}, ${period.is_closed}, ${period.created_at})
                    ON CONFLICT (id) DO NOTHING
                `;
            }
            console.log('   ✅ Periods restored!');
        }

        // 2. Get ledger entries from recovery branch for the missing periods
        console.log('\n📋 Fetching ledger entries from recovery branch...');
        const recoveryEntries = await recoveryDb`SELECT * FROM ledger_entries ORDER BY id`;
        console.log(`   Found ${recoveryEntries.length} ledger entries in recovery branch`);

        // Get ledger entries from main branch
        const mainEntries = await mainDb`SELECT * FROM ledger_entries ORDER BY id`;
        console.log(`   Found ${mainEntries.length} ledger entries in main branch`);

        // Find entries that exist in recovery but not in main
        const mainEntryIds = new Set(mainEntries.map(e => e.id));
        const missingEntries = recoveryEntries.filter(e => !mainEntryIds.has(e.id));
        console.log(`   Missing ledger entries to restore: ${missingEntries.length}`);

        if (missingEntries.length > 0) {
            console.log('\n📥 Restoring missing ledger entries...');
            let restored = 0;
            for (const entry of missingEntries) {
                try {
                    await mainDb`
                        INSERT INTO ledger_entries (id, member_id, period_id, lawas, put_up, hulam_put_up, hulam, interest, payment, penalty, created_at, updated_at)
                        VALUES (${entry.id}, ${entry.member_id}, ${entry.period_id}, ${entry.lawas}, ${entry.put_up}, ${entry.hulam_put_up}, ${entry.hulam}, ${entry.interest}, ${entry.payment}, ${entry.penalty}, ${entry.created_at}, ${entry.updated_at})
                        ON CONFLICT (id) DO NOTHING
                    `;
                    restored++;
                    if (restored % 50 === 0) {
                        console.log(`   Restored ${restored}/${missingEntries.length} entries...`);
                    }
                } catch (err) {
                    console.log(`   ⚠️ Skipped entry ${entry.id}: ${err}`);
                }
            }
            console.log(`   ✅ Restored ${restored} ledger entries!`);
        }

        // 3. Summary
        console.log('\n========================================');
        console.log('✅ RECOVERY COMPLETE!');
        console.log('========================================');
        console.log(`   Periods restored: ${missingPeriods.length}`);
        console.log(`   Ledger entries restored: ${missingEntries.length}`);
        console.log('\nYour data has been recovered from the backup branch.');

    } catch (error) {
        console.error('❌ Error during recovery:', error);
        throw error;
    }

    process.exit(0);
}

recoverData().catch(console.error);
