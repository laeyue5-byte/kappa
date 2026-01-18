'use server';

import { db, schema } from '@/lib/db';
import { eq, desc, sql, and } from 'drizzle-orm';
import { calculateInterest } from '@/lib/utils/format';
import { revalidatePath } from 'next/cache';

const { members, periods, ledgerEntries } = schema;

// ============================================
// MEMBER ACTIONS
// ============================================

export async function getMembers() {
    return await db.query.members.findMany({
        orderBy: [desc(members.lastName), desc(members.firstName)],
    });
}

export async function getMemberById(id: number) {
    return await db.query.members.findFirst({
        where: eq(members.id, id),
        with: {
            ledgerEntries: {
                with: {
                    period: true,
                },
                orderBy: [desc(ledgerEntries.createdAt)],
            },
        },
    });
}

export async function createMember(data: { firstName: string; lastName: string; status?: 'active' | 'inactive' | 'deceased' }) {
    const [member] = await db.insert(members).values({
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status || 'active',
    }).returning();

    revalidatePath('/members');
    return member;
}

export async function updateMember(id: number, data: Partial<{ firstName: string; lastName: string; status: 'active' | 'inactive' | 'deceased' }>) {
    const [member] = await db.update(members)
        .set(data)
        .where(eq(members.id, id))
        .returning();

    revalidatePath('/members');
    revalidatePath(`/members/${id}`);
    return member;
}

export async function deleteMember(id: number) {
    await db.delete(members).where(eq(members.id, id));
    revalidatePath('/members');
}

export async function deleteMemberTransactions(memberId: number) {
    await db.delete(ledgerEntries).where(eq(ledgerEntries.memberId, memberId));
    revalidatePath('/members');
    revalidatePath(`/members/${memberId}`);
    revalidatePath('/ledger');
    revalidatePath('/');
}

export async function getMembersWithStats() {
    const allMembers = await db.query.members.findMany({
        with: {
            ledgerEntries: true,
        },
        orderBy: [desc(members.lastName), desc(members.firstName)],
    });

    const interestRate = 0.10;

    return allMembers.map(member => {
        let totalPutUp = 0;
        let totalLawas = 0;
        let remainingHulamPutUp = 0;
        let remainingHulam = 0;
        let totalInterestCharged = 0;
        let totalInterestPaid = 0;

        const sortedEntries = [...member.ledgerEntries].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        for (const entry of sortedEntries) {
            // Basic totals
            totalPutUp += parseFloat(entry.putUp);
            totalLawas += parseInt(entry.lawas.toString()) || 0;

            // Track total interest charged from all entries
            const entryInterest = parseFloat(entry.interest);
            totalInterestCharged += entryInterest;

            // Track remaining loans
            remainingHulamPutUp += parseFloat(entry.hulamPutUp);
            remainingHulam += parseFloat(entry.hulam);

            // Process payment to calculate remaining balances
            let remainingPayment = parseFloat(entry.payment);

            // Calculate outstanding principal BEFORE this payment
            const outstandingPrincipal = remainingHulamPutUp + remainingHulam;

            // Calculate how much interest is still unpaid up to this point
            const unpaidInterest = totalInterestCharged - totalInterestPaid;

            // 1. Pay Interest first (payments go toward ANY unpaid interest, not just this entry's interest)
            if (remainingPayment > 0 && unpaidInterest > 0) {
                const interestPayment = Math.min(remainingPayment, unpaidInterest);
                remainingPayment -= interestPayment;
                totalInterestPaid += interestPayment;
            }

            // 2. Pay Hulam Put Up
            if (remainingPayment > 0 && remainingHulamPutUp > 0) {
                const paymentVal = Math.min(remainingPayment, remainingHulamPutUp);
                remainingHulamPutUp -= paymentVal;
                remainingPayment -= paymentVal;
            }

            // 3. Pay Hulam
            if (remainingPayment > 0 && remainingHulam > 0) {
                const paymentVal = Math.min(remainingPayment, remainingHulam);
                remainingHulam -= paymentVal;
                remainingPayment -= paymentVal;
            }
        }

        // Remaining interest = total charged - total paid toward interest
        const remainingInterest = Math.max(0, totalInterestCharged - totalInterestPaid);

        return {
            ...member,
            stats: {
                totalLawas,
                totalPutUp,
                remainingHulamPutUp: Math.max(0, remainingHulamPutUp),
                remainingHulam: Math.max(0, remainingHulam),
                remainingInterest
            }
        };
    });
}


export async function importMembersFromCSV(csvData: { first_name: string; last_name: string }[]) {
    const insertData = csvData.map(row => ({
        firstName: row.first_name,
        lastName: row.last_name,
        status: 'active' as const,
    }));

    const result = await db.insert(members).values(insertData).returning();
    revalidatePath('/members');
    return result;
}

/**
 * Pay all outstanding interest for all members in a specific period.
 * Creates payment entries equal to each member's outstanding interest.
 * Returns the IDs of created entries for undo functionality.
 */
export async function payAllMembersInterest(periodId: number) {
    // Get all members with their stats to find outstanding interest
    const allMembers = await db.query.members.findMany({
        where: eq(members.status, 'active'),
        with: {
            ledgerEntries: true,
        },
    });

    let membersPaid = 0;
    let totalInterestPaid = 0;
    const createdEntryIds: number[] = [];

    for (const member of allMembers) {
        // Calculate remaining interest using same logic as getMembersWithStats
        let totalInterestCharged = 0;
        let totalInterestPaidSoFar = 0;
        let remainingHulamPutUp = 0;
        let remainingHulam = 0;

        const sortedEntries = [...member.ledgerEntries].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        for (const entry of sortedEntries) {
            const entryInterest = parseFloat(entry.interest);
            totalInterestCharged += entryInterest;

            remainingHulamPutUp += parseFloat(entry.hulamPutUp);
            remainingHulam += parseFloat(entry.hulam);

            let remainingPayment = parseFloat(entry.payment);
            const unpaidInterest = totalInterestCharged - totalInterestPaidSoFar;

            if (remainingPayment > 0 && unpaidInterest > 0) {
                const interestPayment = Math.min(remainingPayment, unpaidInterest);
                remainingPayment -= interestPayment;
                totalInterestPaidSoFar += interestPayment;
            }

            if (remainingPayment > 0 && remainingHulamPutUp > 0) {
                const paymentVal = Math.min(remainingPayment, remainingHulamPutUp);
                remainingHulamPutUp -= paymentVal;
                remainingPayment -= paymentVal;
            }

            if (remainingPayment > 0 && remainingHulam > 0) {
                const paymentVal = Math.min(remainingPayment, remainingHulam);
                remainingHulam -= paymentVal;
            }
        }

        const remainingInterest = Math.max(0, totalInterestCharged - totalInterestPaidSoFar);

        // If member has outstanding interest, create a payment entry
        if (remainingInterest > 0) {
            const [newEntry] = await db.insert(ledgerEntries).values({
                memberId: member.id,
                periodId: periodId,
                lawas: '0',
                putUp: '0',
                hulamPutUp: '0',
                hulam: '0',
                interest: '0',
                payment: remainingInterest.toFixed(2),
                penalty: '0',
            }).returning();
            createdEntryIds.push(newEntry.id);
            membersPaid++;
            totalInterestPaid += remainingInterest;
        }
    }

    revalidatePath('/');
    revalidatePath('/members');
    revalidatePath('/ledger');

    return {
        success: true,
        membersPaid,
        totalInterestPaid,
        entryIds: createdEntryIds,
    };
}

/**
 * Undo a bulk interest payment by deleting the created entries.
 */
export async function undoPayAllMembersInterest(entryIds: number[]) {
    if (entryIds.length === 0) {
        return { success: false, message: 'No entries to undo' };
    }

    // Delete all the entries that were created
    for (const id of entryIds) {
        await db.delete(ledgerEntries).where(eq(ledgerEntries.id, id));
    }

    revalidatePath('/');
    revalidatePath('/members');
    revalidatePath('/ledger');

    return {
        success: true,
        entriesDeleted: entryIds.length,
    };
}

/**
 * Find and delete all payment-only entries (bulk interest payments) from a specific period.
 * These are entries where everything is 0 except payment.
 * Use with caution - only for undoing accidental bulk payments.
 */
export async function deleteBulkInterestPayments(periodId: number) {
    // Find all payment-only entries in this period
    const allEntries = await db.query.ledgerEntries.findMany({
        where: eq(ledgerEntries.periodId, periodId),
    });

    // Filter to find payment-only entries (characteristic of bulk interest payments)
    const paymentOnlyEntries = allEntries.filter(entry =>
        parseFloat(entry.lawas.toString()) === 0 &&
        parseFloat(entry.putUp) === 0 &&
        parseFloat(entry.hulamPutUp) === 0 &&
        parseFloat(entry.hulam) === 0 &&
        parseFloat(entry.interest) === 0 &&
        parseFloat(entry.payment) > 0 &&
        parseFloat(entry.penalty) === 0
    );

    if (paymentOnlyEntries.length === 0) {
        return {
            success: false,
            message: 'No bulk interest payment entries found',
            entriesDeleted: 0,
        };
    }

    // Delete them
    for (const entry of paymentOnlyEntries) {
        await db.delete(ledgerEntries).where(eq(ledgerEntries.id, entry.id));
    }

    revalidatePath('/');
    revalidatePath('/members');
    revalidatePath('/ledger');

    return {
        success: true,
        entriesDeleted: paymentOnlyEntries.length,
        totalPaymentRemoved: paymentOnlyEntries.reduce((acc, e) => acc + parseFloat(e.payment), 0),
    };
}

// ============================================
// PERIOD ACTIONS
// ============================================

export async function getPeriods() {
    return await db.query.periods.findMany({
        orderBy: [desc(periods.startDate)],
    });
}

export async function getPeriodById(id: number) {
    return await db.query.periods.findFirst({
        where: eq(periods.id, id),
    });
}

export async function createPeriod(data: { name: string; startDate: Date; endDate?: Date }) {
    const [period] = await db.insert(periods).values({
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
    }).returning();

    revalidatePath('/');
    revalidatePath('/periods');
    revalidatePath('/ledger');
    return period;
}

export async function updatePeriod(id: number, data: Partial<{ name: string; startDate: Date; endDate: Date; isClosed: boolean }>) {
    const [period] = await db.update(periods)
        .set(data)
        .where(eq(periods.id, id))
        .returning();

    revalidatePath('/');
    revalidatePath('/periods');
    revalidatePath('/ledger');
    return period;
}

export async function closePeriod(id: number) {
    const [period] = await db.update(periods)
        .set({ isClosed: true })
        .where(eq(periods.id, id))
        .returning();

    revalidatePath('/');
    return period;
}

export async function deletePeriod(id: number) {
    // This will cascade delete all ledger entries for this period
    await db.delete(periods).where(eq(periods.id, id));

    revalidatePath('/');
    revalidatePath('/periods');
    revalidatePath('/members');
    revalidatePath('/ledger');

    return { success: true };
}

export async function closePeriodAndMigrate(
    currentPeriodId: number,
    newPeriodData: { name: string; startDate: Date; endDate?: Date }
) {
    // 1. Close the current period
    await db.update(periods)
        .set({ isClosed: true, endDate: new Date() })
        .where(eq(periods.id, currentPeriodId));

    // 2. Create the new period
    const [newPeriod] = await db.insert(periods).values({
        name: newPeriodData.name,
        startDate: newPeriodData.startDate,
        endDate: newPeriodData.endDate,
    }).returning();

    // 3. Get all members with their ledger entries
    const allMembers = await db.query.members.findMany({
        where: eq(members.status, 'active'),
        with: {
            ledgerEntries: true,
        },
    });

    // 4. Calculate outstanding balances for each member and create carry-forward entries
    const interestRate = 0.10;
    const migratedMembers: number[] = [];

    for (const member of allMembers) {
        // Calculate totals and outstanding
        let remainingHulamPutUp = 0;
        let remainingHulam = 0;
        let totalLawas = 0;

        // Sort entries chronologically
        const sortedEntries = [...member.ledgerEntries].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Track interest per period
        const periodInterestCharged = new Map<number, number>();
        const periodInterestPaidStatus = new Map<number, boolean>();

        for (const entry of sortedEntries) {
            const periodId = entry.periodId;

            // Add lawas (cumulative)
            totalLawas += parseInt(entry.lawas.toString()) || 0;

            // Add new loans
            remainingHulamPutUp += parseFloat(entry.hulamPutUp);
            remainingHulam += parseFloat(entry.hulam);
            const remainingPrincipal = remainingHulamPutUp + remainingHulam;

            // Calculate interest for period if not already calculated
            if (!periodInterestCharged.has(periodId) && remainingPrincipal > 0) {
                const interestForPeriod = remainingPrincipal * interestRate;
                periodInterestCharged.set(periodId, interestForPeriod);
                periodInterestPaidStatus.set(periodId, false);
            }

            // Process payment
            const payment = parseFloat(entry.payment);
            if (payment > 0) {
                const interestForPeriod = periodInterestCharged.get(periodId) || 0;
                const isPeriodInterestPaid = periodInterestPaidStatus.get(periodId) || false;

                let remainingPayment = payment;

                if (!isPeriodInterestPaid && interestForPeriod > 0) {
                    const interestPayment = Math.min(remainingPayment, interestForPeriod);
                    remainingPayment -= interestPayment;
                    if (interestPayment >= interestForPeriod) {
                        periodInterestPaidStatus.set(periodId, true);
                    }
                }

                if (remainingPayment > 0) {
                    const hulamPutUpPayment = Math.min(remainingPayment, remainingHulamPutUp);
                    remainingHulamPutUp -= hulamPutUpPayment;
                    remainingPayment -= hulamPutUpPayment;

                    const hulamPayment = Math.min(remainingPayment, remainingHulam);
                    remainingHulam -= hulamPayment;
                }
            }
        }

        // If member has outstanding balance, create carry-forward entry
        const outstandingPrincipal = remainingHulamPutUp + remainingHulam;
        if (outstandingPrincipal > 0 || totalLawas > 0) {
            await db.insert(ledgerEntries).values({
                memberId: member.id,
                periodId: newPeriod.id,
                lawas: totalLawas.toString(),
                putUp: '0',
                hulamPutUp: remainingHulamPutUp.toFixed(2),
                hulam: remainingHulam.toFixed(2),
                interest: '0', // Interest will be calculated dynamically
                payment: '0',
                penalty: '0',
            });
            migratedMembers.push(member.id);
        }
    }

    revalidatePath('/');
    revalidatePath('/periods');
    revalidatePath('/members');
    revalidatePath('/ledger');

    return {
        success: true,
        newPeriod,
        migratedMemberCount: migratedMembers.length,
    };
}

/**
 * Create a new period and charge interest on outstanding balances from a source period.
 * This function does NOT duplicate the principal - it only creates an interest entry
 * for members who have outstanding balances.
 * 
 * The outstanding principal is still tracked from the original entries in previous periods.
 * This just adds the 10% interest charge for the new period.
 */
export async function createPeriodWithCarryForward(
    sourcePeriodId: number,
    newPeriodData: { name: string; startDate: Date; endDate?: Date }
) {
    // 1. Create the new period
    const [newPeriod] = await db.insert(periods).values({
        name: newPeriodData.name,
        startDate: newPeriodData.startDate,
        endDate: newPeriodData.endDate,
    }).returning();

    // 2. Get all members with their ledger entries up to and including the source period
    const allMembers = await db.query.members.findMany({
        where: eq(members.status, 'active'),
        with: {
            ledgerEntries: true,
        },
    });

    // 3. Calculate outstanding balances for each member and create interest entries
    // Interest is charged on UNPAID PRINCIPAL only (after all payments are applied)
    const interestRate = 0.10;
    const migratedMembers: number[] = [];

    for (const member of allMembers) {
        // Only consider entries up to the source period
        const relevantEntries = member.ledgerEntries.filter(e => e.periodId <= sourcePeriodId);

        if (relevantEntries.length === 0) continue;

        // Calculate outstanding balance using same logic as getMembersWithStats
        let remainingHulamPutUp = 0;
        let remainingHulam = 0;
        let totalInterestCharged = 0;
        let totalInterestPaid = 0;

        // Sort entries chronologically
        const sortedEntries = [...relevantEntries].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        for (const entry of sortedEntries) {
            // Add new loans
            remainingHulamPutUp += parseFloat(entry.hulamPutUp);
            remainingHulam += parseFloat(entry.hulam);

            // Track total interest charged from all entries
            const entryInterest = parseFloat(entry.interest);
            totalInterestCharged += entryInterest;

            // Process payment
            let remainingPayment = parseFloat(entry.payment);

            // Calculate unpaid interest at this point
            const unpaidInterest = totalInterestCharged - totalInterestPaid;

            // 1. Pay Interest first (payments go toward ANY unpaid interest)
            if (remainingPayment > 0 && unpaidInterest > 0) {
                const interestPayment = Math.min(remainingPayment, unpaidInterest);
                remainingPayment -= interestPayment;
                totalInterestPaid += interestPayment;
            }

            // 2. Pay Hulam Put-up
            if (remainingPayment > 0 && remainingHulamPutUp > 0) {
                const hulamPutUpPayment = Math.min(remainingPayment, remainingHulamPutUp);
                remainingHulamPutUp -= hulamPutUpPayment;
                remainingPayment -= hulamPutUpPayment;
            }

            // 3. Pay Hulam
            if (remainingPayment > 0 && remainingHulam > 0) {
                const hulamPayment = Math.min(remainingPayment, remainingHulam);
                remainingHulam -= hulamPayment;
            }
        }

        // Calculate the REMAINING unpaid principal (after all payments)
        const outstandingPrincipal = Math.max(0, remainingHulamPutUp) + Math.max(0, remainingHulam);

        // Only charge interest if there's outstanding PRINCIPAL
        if (outstandingPrincipal > 0) {
            // Calculate interest on outstanding principal only
            const interestCharge = outstandingPrincipal * interestRate;

            // Create ONLY an interest entry - no principal duplication!
            await db.insert(ledgerEntries).values({
                memberId: member.id,
                periodId: newPeriod.id,
                lawas: '0',           // No new lawas
                putUp: '0',           // No new put-up
                hulamPutUp: '0',      // DO NOT duplicate - stays 0
                hulam: '0',           // DO NOT duplicate - stays 0
                interest: interestCharge.toFixed(2), // Only charge interest on principal
                payment: '0',
                penalty: '0',
            });
            migratedMembers.push(member.id);
        }
    }

    revalidatePath('/');
    revalidatePath('/periods');
    revalidatePath('/members');
    revalidatePath('/ledger');

    return {
        success: true,
        newPeriod,
        migratedMemberCount: migratedMembers.length,
    };
}

// ============================================
// LEDGER ENTRY ACTIONS
// ============================================

export async function getLedgerEntriesByPeriod(periodId: number) {
    return await db.query.ledgerEntries.findMany({
        where: eq(ledgerEntries.periodId, periodId),
        with: {
            member: true,
        },
        orderBy: [desc(ledgerEntries.createdAt)],
    });
}

export async function getLedgerEntriesByMember(memberId: number) {
    return await db.query.ledgerEntries.findMany({
        where: eq(ledgerEntries.memberId, memberId),
        with: {
            period: true,
        },
        orderBy: [desc(ledgerEntries.createdAt)],
    });
}

export async function createLedgerEntry(data: {
    memberId: number;
    periodId: number;
    lawas?: string;
    putUp?: string;
    hulamPutUp?: string;
    hulam?: string;
    payment?: string;
    penalty?: string;
}) {
    // Auto-calculate interest (10% of hulam + hulam put-up)
    const hulamAmount = parseFloat(data.hulam || '0');
    const hulamPutUpAmount = parseFloat(data.hulamPutUp || '0');
    const interest = calculateInterest(hulamAmount + hulamPutUpAmount);

    const [entry] = await db.insert(ledgerEntries).values({
        memberId: data.memberId,
        periodId: data.periodId,
        lawas: data.lawas || '0',
        putUp: data.putUp || '0',
        hulamPutUp: data.hulamPutUp || '0',
        hulam: data.hulam || '0',
        interest: interest.toString(),
        payment: data.payment || '0',
        penalty: data.penalty || '0',
    }).returning();

    revalidatePath('/');
    revalidatePath(`/members/${data.memberId}`);
    return entry;
}

export async function updateLedgerEntry(id: number, data: Partial<{
    lawas: string;
    putUp: string;
    hulamPutUp: string;
    hulam: string;
    payment: string;
    penalty: string;
}>) {
    // If hulam or hulamPutUp is updated, recalculate interest
    let updateData: Record<string, string> = { ...data };
    if (data.hulam !== undefined || data.hulamPutUp !== undefined) {
        const hulamAmount = parseFloat(data.hulam || '0');
        const hulamPutUpAmount = parseFloat(data.hulamPutUp || '0');
        updateData.interest = calculateInterest(hulamAmount + hulamPutUpAmount).toString();
    }

    const [entry] = await db.update(ledgerEntries)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(ledgerEntries.id, id))
        .returning();

    revalidatePath('/');
    return entry;
}

export async function deleteLedgerEntry(id: number) {
    await db.delete(ledgerEntries).where(eq(ledgerEntries.id, id));

    revalidatePath('/');
    revalidatePath('/ledger');
    revalidatePath('/members');

    return { success: true };
}

// ============================================
// DASHBOARD AGGREGATES
// ============================================

export async function getDashboardStats() {
    // Get total members count
    const membersResult = await db.select({ count: sql<number>`count(*)` }).from(members);
    const totalMembers = membersResult[0]?.count || 0;

    // Get all members with their ledger entries to calculate accurate outstanding
    const allMembers = await db.query.members.findMany({
        with: {
            ledgerEntries: true,
        },
    });

    // Aggregate totals
    let totalPutUp = 0;
    let totalHulamPutUp = 0;
    let totalHulam = 0;
    let totalPayments = 0;
    let totalPenalty = 0;
    let totalLawas = 0;
    let outstandingLoansTotal = 0;
    let totalInterestCharged = 0;
    let totalInterestPaid = 0;

    for (const member of allMembers) {
        // Use consistent logic - same as getMembersWithStats
        let remainingHulamPutUp = 0;
        let remainingHulam = 0;
        let memberInterestCharged = 0;
        let memberInterestPaid = 0;

        // Sort entries chronologically for proper payment application
        const sortedEntries = [...member.ledgerEntries].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        for (const entry of sortedEntries) {
            // Aggregate totals directly from DB values
            totalPutUp += parseFloat(entry.putUp);
            totalHulamPutUp += parseFloat(entry.hulamPutUp);
            totalHulam += parseFloat(entry.hulam);
            totalPayments += parseFloat(entry.payment);
            totalPenalty += parseFloat(entry.penalty);
            totalLawas += parseInt(entry.lawas.toString()) || 0;

            // Track loans
            remainingHulamPutUp += parseFloat(entry.hulamPutUp);
            remainingHulam += parseFloat(entry.hulam);

            // Track interest charged
            const entryInterest = parseFloat(entry.interest);
            memberInterestCharged += entryInterest;
            totalInterestCharged += entryInterest;

            // Process payment - consistent with other functions
            let remainingPayment = parseFloat(entry.payment);

            // Calculate unpaid interest at this point
            const unpaidInterest = memberInterestCharged - memberInterestPaid;

            // 1. Pay Interest first (payments go toward ANY unpaid interest)
            if (remainingPayment > 0 && unpaidInterest > 0) {
                const interestPayment = Math.min(remainingPayment, unpaidInterest);
                remainingPayment -= interestPayment;
                memberInterestPaid += interestPayment;
                totalInterestPaid += interestPayment;
            }

            // 2. Pay Hulam Put Up
            if (remainingPayment > 0 && remainingHulamPutUp > 0) {
                const paid = Math.min(remainingPayment, remainingHulamPutUp);
                remainingHulamPutUp -= paid;
                remainingPayment -= paid;
            }

            // 3. Pay Hulam
            if (remainingPayment > 0 && remainingHulam > 0) {
                const paid = Math.min(remainingPayment, remainingHulam);
                remainingHulam -= paid;
            }
        }

        // Add this member's outstanding to total
        outstandingLoansTotal += Math.max(0, remainingHulamPutUp) + Math.max(0, remainingHulam);
    }

    // Total Capital = Put-up (cash) + Interest PAID (actually collected) + Penalties
    // Note: We use interest PAID, not interest charged, since unpaid interest isn't yet capital
    const totalCapital = totalPutUp + totalInterestPaid + totalPenalty;

    // Total Loans = Hulam Put-up + Hulam (original amounts disbursed)
    const totalLoans = totalHulamPutUp + totalHulam;

    return {
        totalMembers,
        totalCapital,
        totalPutUp,
        totalHulamPutUp,
        totalHulam,
        totalLoans,
        totalInterest: totalInterestCharged,
        totalInterestPaid,
        outstandingLoans: outstandingLoansTotal,
        totalPayments,
        totalPenalty,
        totalLawas,
    };
}

// ============================================
// TEMPORARY: RESET/DELETE ACTIONS (FOR TESTING)
// ============================================

export async function deleteAllLedgerEntries() {
    await db.delete(ledgerEntries);
    revalidatePath('/');
    revalidatePath('/members');
    revalidatePath('/ledger');
    return { success: true, message: 'All ledger entries deleted' };
}
