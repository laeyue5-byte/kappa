import { NextRequest, NextResponse } from 'next/server';
import { getLedgerEntriesByPeriod, getPeriodById } from '@/lib/actions';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const periodId = searchParams.get('period');

    if (!periodId) {
        return NextResponse.json({ error: 'Period ID required' }, { status: 400 });
    }

    const period = await getPeriodById(parseInt(periodId));
    if (!period) {
        return NextResponse.json({ error: 'Period not found' }, { status: 404 });
    }

    const entries = await getLedgerEntriesByPeriod(parseInt(periodId));

    // Build CSV content
    const headers = ['Date', 'Member ID', 'Member Name', 'Lawas', 'Put-up', 'Hulam Put-up', 'Hulam', 'Payment', 'Penalty'];

    const rows = entries.map(entry => [
        new Date(entry.createdAt).toISOString().split('T')[0],
        entry.memberId,
        entry.member ? `${entry.member.lastName}, ${entry.member.firstName}` : 'Unknown',
        entry.lawas,
        entry.putUp,
        entry.hulamPutUp,
        entry.hulam,
        entry.payment,
        entry.penalty,
    ]);

    // Calculate totals
    const totals = entries.reduce(
        (acc, entry) => ({
            lawas: acc.lawas + (parseInt(entry.lawas.toString()) || 0),
            putUp: acc.putUp + parseFloat(entry.putUp),
            hulamPutUp: acc.hulamPutUp + parseFloat(entry.hulamPutUp),
            hulam: acc.hulam + parseFloat(entry.hulam),
            payment: acc.payment + parseFloat(entry.payment),
            penalty: acc.penalty + parseFloat(entry.penalty),
        }),
        { lawas: 0, putUp: 0, hulamPutUp: 0, hulam: 0, payment: 0, penalty: 0 }
    );

    // Add totals row
    rows.push([]);
    rows.push([
        'TOTAL',
        '',
        '',
        totals.lawas,
        totals.putUp.toFixed(2),
        totals.hulamPutUp.toFixed(2),
        totals.hulam.toFixed(2),
        totals.payment.toFixed(2),
        totals.penalty.toFixed(2),
    ]);

    // Convert to CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="ledger-${period.name.replace(/\s+/g, '-')}.csv"`,
        },
    });
}
