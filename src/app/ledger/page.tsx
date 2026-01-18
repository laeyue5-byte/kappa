import { getPeriods, getMembers, getLedgerEntriesByPeriod } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, FileSpreadsheet, AlertTriangle, Wallet, Banknote, TrendingUp, CreditCard, Edit, Download } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils/format';
import { LedgerEntryDialog } from '@/components/ledger-entry-dialog';
import { LedgerPeriodSelector } from '@/components/ledger-period-selector';
import { EditLedgerEntryDialog } from '@/components/edit-ledger-entry-dialog';

interface Props {
    searchParams: Promise<{ period?: string }>;
}

export default async function LedgerPage({ searchParams }: Props) {
    const { period: periodParam } = await searchParams;
    const periods = await getPeriods();
    const members = await getMembers();

    // Find active period or use the one from query param
    const selectedPeriodId = periodParam ? parseInt(periodParam) : periods.find(p => !p.isClosed)?.id;
    const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

    const entries = selectedPeriodId ? await getLedgerEntriesByPeriod(selectedPeriodId) : [];

    // Calculate totals for the period
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

    // Calculate summary metrics
    const totalContributions = totals.putUp;
    const totalLoansGiven = totals.hulamPutUp + totals.hulam;
    const totalPaymentsReceived = totals.payment;
    const totalPenalties = totals.penalty;
    const netCashFlow = totalContributions + totalPaymentsReceived + totalPenalties - totalLoansGiven;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
                    <p className="text-muted-foreground">
                        Record and view transactions for each collection period.
                    </p>
                </div>
                <div className="flex gap-2">
                    {entries.length > 0 && (
                        <Button variant="outline" asChild>
                            <a
                                href={`/api/export/ledger?period=${selectedPeriodId}`}
                                download={`ledger-${selectedPeriod?.name || 'export'}.csv`}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </a>
                        </Button>
                    )}
                    {selectedPeriod && !selectedPeriod.isClosed && (
                        <LedgerEntryDialog
                            periodId={selectedPeriod.id}
                            members={members}
                            trigger={
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Transaction
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Period Selector */}
            {periods.length === 0 ? (
                <Card className="border-warning bg-warning/10">
                    <CardContent className="flex items-center justify-between py-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-warning" />
                            <div>
                                <p className="font-medium">No periods available</p>
                                <p className="text-sm text-muted-foreground">Create a period first to start recording transactions.</p>
                            </div>
                        </div>
                        <Link href="/periods/new">
                            <Button>Create Period</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Period Selector Card */}
                    <Card>
                        <CardContent className="py-4">
                            <LedgerPeriodSelector
                                periods={periods}
                                selectedPeriodId={selectedPeriodId}
                            />
                        </CardContent>
                    </Card>

                    {selectedPeriod ? (
                        <>
                            {/* Summary Stats Cards */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                                <Card>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                                                <Banknote className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Loans Given</p>
                                                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                                    {formatCurrency(totalLoansGiven)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                                                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Payments Received</p>
                                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(totalPaymentsReceived)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                                                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Penalties</p>
                                                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                                    {formatCurrency(totalPenalties)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={netCashFlow >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${netCashFlow >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                                <TrendingUp className={`h-5 w-5 ${netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Net Cash Flow</p>
                                                <p className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {formatCurrency(netCashFlow)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Ledger Table */}
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {selectedPeriod.name}
                                                {selectedPeriod.isClosed && (
                                                    <Badge variant="secondary">Read Only</Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription>
                                                {entries.length} transaction{entries.length !== 1 ? 's' : ''} • {totals.lawas} total Lawas
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {entries.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Start recording transactions for this period.
                                            </p>
                                            {!selectedPeriod.isClosed && (
                                                <LedgerEntryDialog
                                                    periodId={selectedPeriod.id}
                                                    members={members}
                                                    trigger={
                                                        <Button>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add First Transaction
                                                        </Button>
                                                    }
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-24">Date</TableHead>
                                                        <TableHead>Member</TableHead>
                                                        <TableHead className="text-center">Lawas</TableHead>
                                                        <TableHead className="text-right">Put-up</TableHead>
                                                        <TableHead className="text-right">Loans</TableHead>
                                                        <TableHead className="text-right">Payment</TableHead>
                                                        <TableHead className="text-right">Penalty</TableHead>
                                                        {!selectedPeriod.isClosed && (
                                                            <TableHead className="w-12"></TableHead>
                                                        )}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {entries.map((entry) => {
                                                        const loans = parseFloat(entry.hulamPutUp) + parseFloat(entry.hulam);
                                                        return (
                                                            <TableRow key={entry.id}>
                                                                <TableCell className="text-muted-foreground text-sm">
                                                                    {formatDate(entry.createdAt)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Link href={`/members/${entry.memberId}`} className="hover:underline">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                                <span className="text-xs font-medium text-primary">
                                                                                    {entry.member ? getInitials(entry.member.firstName, entry.member.lastName) : '?'}
                                                                                </span>
                                                                            </div>
                                                                            <span className="font-medium">
                                                                                {entry.member ? `${entry.member.lastName}, ${entry.member.firstName}` : 'Unknown'}
                                                                            </span>
                                                                        </div>
                                                                    </Link>
                                                                </TableCell>
                                                                <TableCell className="text-center font-mono">
                                                                    {parseInt(entry.lawas.toString()) > 0 ? (
                                                                        <Badge variant="outline">{entry.lawas}</Badge>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {parseFloat(entry.putUp) > 0 ? (
                                                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                                                            {formatCurrency(entry.putUp)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {loans > 0 ? (
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-red-600 dark:text-red-400 font-medium">
                                                                                {formatCurrency(loans)}
                                                                            </span>
                                                                            {parseFloat(entry.hulamPutUp) > 0 && parseFloat(entry.hulam) > 0 && (
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    HP: {formatCurrency(entry.hulamPutUp)} + H: {formatCurrency(entry.hulam)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {parseFloat(entry.payment) > 0 ? (
                                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                                            {formatCurrency(entry.payment)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {parseFloat(entry.penalty) > 0 ? (
                                                                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                                                                            {formatCurrency(entry.penalty)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </TableCell>
                                                                {!selectedPeriod.isClosed && (
                                                                    <TableCell>
                                                                        <EditLedgerEntryDialog
                                                                            entry={entry}
                                                                            memberName={entry.member ? `${entry.member.lastName}, ${entry.member.firstName}` : 'Unknown'}
                                                                            trigger={
                                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                                    <Edit className="h-4 w-4" />
                                                                                </Button>
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                )}
                                                            </TableRow>
                                                        );
                                                    })}

                                                    {/* Totals Row */}
                                                    <TableRow className="bg-muted/50 font-bold border-t-2">
                                                        <TableCell colSpan={2} className="text-right">PERIOD TOTAL</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge>{totals.lawas}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right text-green-600 dark:text-green-400">
                                                            {formatCurrency(totals.putUp)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600 dark:text-red-400">
                                                            {formatCurrency(totals.hulamPutUp + totals.hulam)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-blue-600 dark:text-blue-400">
                                                            {formatCurrency(totals.payment)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-orange-600 dark:text-orange-400">
                                                            {formatCurrency(totals.penalty)}
                                                        </TableCell>
                                                        {!selectedPeriod.isClosed && <TableCell />}
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Select a period to view transactions.</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
