import { getMemberById, getPeriods } from '@/lib/actions';
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
import { Edit, Wallet, Banknote, TrendingUp, Plus, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditMemberDialog } from '@/components/edit-member-dialog';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils/format';
import { MemberTransactionDialog } from '@/components/member-transaction-dialog';
import { RecordPaymentDialog } from '@/components/record-payment-dialog';
import { BackButton } from '@/components/back-button';
import { DeleteMemberTransactionsDialog } from '@/components/delete-member-transactions-dialog';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: Props) {
    const { id } = await params;
    const [member, periods] = await Promise.all([
        getMemberById(parseInt(id)),
        getPeriods()
    ]);

    if (!member) {
        notFound();
    }

    // Calculate totals from ledger entries
    const totals = member.ledgerEntries.reduce(
        (acc, entry) => ({
            lawas: acc.lawas + parseInt(entry.lawas.toString()) || 0,
            putUp: acc.putUp + parseFloat(entry.putUp),
            hulamPutUp: acc.hulamPutUp + parseFloat(entry.hulamPutUp),
            hulam: acc.hulam + parseFloat(entry.hulam),
            payment: acc.payment + parseFloat(entry.payment),
            penalty: acc.penalty + parseFloat(entry.penalty),
        }),
        { lawas: 0, putUp: 0, hulamPutUp: 0, hulam: 0, payment: 0, penalty: 0 }
    );

    // ========================================
    // PUT-UP (Membership Fee) Calculation
    // ========================================
    // Required Put-up = Total Lawas × ₱2,000 per share
    // Put-up Contribution = Cash Put-up + Hulam Put-up (borrowing counts as satisfying the requirement)
    const PUT_UP_PER_LAWAS = 2000;
    const requiredPutUp = totals.lawas * PUT_UP_PER_LAWAS;
    const putUpContribution = totals.putUp + totals.hulamPutUp; // Both cash and borrowed count
    const putUpPaid = totals.putUp; // Just cash paid
    const putUpBalance = Math.max(0, requiredPutUp - putUpContribution);

    // ========================================
    // LOANS (Hulam + Hulam Put-up) Calculation
    // ========================================
    // Get the current (most recent) active period
    const activePeriods = periods.filter(p => !p.isClosed);
    const currentPeriod = activePeriods[0];

    // Interest rate per period
    const interestRate = 0.10;

    // ========================================
    // CALCULATE OUTSTANDING PRINCIPAL
    // ========================================
    // Process entries in chronological order
    // Interest is calculated once per period when first loan is taken

    const sortedEntries = [...member.ledgerEntries].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Track principal and interest
    let remainingPrincipal = 0;
    let remainingHulamPutUp = 0;  // Track Hulam Put-up separately
    let remainingHulam = 0;       // Track Hulam separately
    let currentPeriodInterestPaid = false;
    let currentPeriodInterestAmount = 0;

    // Track interest per period (only charged once per period)
    const periodInterestCharged = new Map<number, number>();
    const periodInterestPaidStatus = new Map<number, boolean>();

    // Process each entry in order
    for (const entry of sortedEntries) {
        const periodId = entry.periodId;
        const isCurrentPeriod = currentPeriod && periodId === currentPeriod.id;

        // Add new loans from this entry
        const newHulamPutUp = parseFloat(entry.hulamPutUp);
        const newHulam = parseFloat(entry.hulam);
        remainingHulamPutUp += newHulamPutUp;
        remainingHulam += newHulam;
        remainingPrincipal = remainingHulamPutUp + remainingHulam;

        // Calculate interest for this period if not already calculated
        if (!periodInterestCharged.has(periodId) && remainingPrincipal > 0) {
            const interestForPeriod = remainingPrincipal * interestRate;
            periodInterestCharged.set(periodId, interestForPeriod);
            periodInterestPaidStatus.set(periodId, false);

            if (isCurrentPeriod) {
                currentPeriodInterestAmount = interestForPeriod;
            }
        }

        // Process payment from this entry
        const payment = parseFloat(entry.payment);
        if (payment > 0) {
            const interestForPeriod = periodInterestCharged.get(periodId) || 0;
            const isPeriodInterestPaid = periodInterestPaidStatus.get(periodId) || false;

            let remainingPayment = payment;

            if (!isPeriodInterestPaid && interestForPeriod > 0) {
                // First, cover interest for this period
                const interestPayment = Math.min(remainingPayment, interestForPeriod);
                remainingPayment -= interestPayment;

                if (interestPayment >= interestForPeriod) {
                    periodInterestPaidStatus.set(periodId, true);
                    if (isCurrentPeriod) {
                        currentPeriodInterestPaid = true;
                    }
                }
            }

            // Remaining payment goes to principal (Hulam Put-up first, then Hulam)
            if (remainingPayment > 0) {
                // Pay off Hulam Put-up first
                const hulamPutUpPayment = Math.min(remainingPayment, remainingHulamPutUp);
                remainingHulamPutUp -= hulamPutUpPayment;
                remainingPayment -= hulamPutUpPayment;

                // Then pay off Hulam
                const hulamPayment = Math.min(remainingPayment, remainingHulam);
                remainingHulam -= hulamPayment;
                remainingPayment -= hulamPayment;
            }

            remainingPrincipal = remainingHulamPutUp + remainingHulam;
        }
    }

    // Outstanding loan principal
    const outstandingPrincipal = remainingPrincipal;

    // Total loans (for reference)
    const totalLoans = totals.hulamPutUp + totals.hulam;

    // Use the actual tracked outstanding values (not proportional)
    const outstandingHulamPutUp = remainingHulamPutUp;
    const outstandingHulam = remainingHulam;

    // Interest for current period (calculated at start of period, before any payments)
    // If no entries in current period yet, calculate based on current principal
    const currentPeriodInterest = currentPeriodInterestAmount > 0
        ? currentPeriodInterestAmount
        : outstandingPrincipal * interestRate;

    // Check if current period has interest paid
    const isCurrentPeriodInterestPaid = currentPeriodInterestPaid;

    // Interest owed = current period interest if not yet paid
    const interestOwed = isCurrentPeriodInterestPaid ? 0 : currentPeriodInterest;

    // Track which periods have any payments (for the dialog)
    const periodIdsWithPayments = new Set(
        member.ledgerEntries
            .filter(entry => parseFloat(entry.payment) > 0)
            .map(entry => entry.periodId)
    );

    // ========================================
    // TOTAL OUTSTANDING BALANCE
    // ========================================
    // = Outstanding Principal + Current Period Interest (if not paid)
    // Once interest is paid for a period, balance is just the principal
    const outstandingBalance = outstandingPrincipal + interestOwed;

    const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        deceased: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <BackButton fallbackHref="/members" />
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg sm:text-xl font-bold text-primary">
                                {getInitials(member.firstName, member.lastName)}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">
                                {member.lastName}, {member.firstName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge className={statusColors[member.status]} variant="secondary">
                                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                </Badge>
                                <span className="text-muted-foreground text-xs sm:text-sm">
                                    Member since {formatDate(member.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <DeleteMemberTransactionsDialog
                        memberId={member.id}
                        memberName={`${member.lastName}, ${member.firstName}`}
                        variant="button"
                    />
                    <RecordPaymentDialog
                        memberId={member.id}
                        memberName={`${member.lastName}, ${member.firstName}`}
                        outstanding={{
                            hulamPutUp: outstandingHulamPutUp,
                            hulam: outstandingHulam,
                            interest: interestOwed,
                        }}
                        totalPayments={totals.payment}
                        periods={periods}
                        periodIdsWithInterestPaid={Array.from(periodIdsWithPayments)}
                        trigger={
                            <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Record Payment
                            </Button>
                        }
                    />
                    <MemberTransactionDialog
                        memberId={member.id}
                        memberName={`${member.lastName}, ${member.firstName}`}
                        periods={periods}
                        trigger={
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Transaction
                            </Button>
                        }
                    />
                    <EditMemberDialog
                        member={member}
                        trigger={
                            <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {/* Put-up (Membership Fee) */}
                <Card className={putUpBalance === 0 && requiredPutUp > 0 ? 'border-green-200 dark:border-green-800' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${putUpBalance === 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                                <Wallet className={`h-5 w-5 ${putUpBalance === 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Put-up ({totals.lawas} Lawas)
                                </p>
                                {putUpBalance === 0 && requiredPutUp > 0 ? (
                                    <div>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">SATISFIED ✓</p>
                                        {totals.hulamPutUp > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(putUpPaid)} cash + {formatCurrency(totals.hulamPutUp)} borrowed
                                            </p>
                                        )}
                                    </div>
                                ) : requiredPutUp === 0 ? (
                                    <p className="text-xl font-bold text-muted-foreground">No shares</p>
                                ) : (
                                    <div>
                                        <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                            {formatCurrency(putUpBalance)} <span className="text-sm font-normal">remaining</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatCurrency(putUpContribution)} of {formatCurrency(requiredPutUp)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Outstanding Loans */}
                <Card className={outstandingPrincipal > 0 ? 'border-orange-200 dark:border-orange-800' : 'border-green-200 dark:border-green-800'}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${outstandingPrincipal > 0 ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                                <Banknote className={`h-5 w-5 ${outstandingPrincipal > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Outstanding Loans</p>
                                {outstandingPrincipal === 0 ? (
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">NO DEBT ✓</p>
                                ) : (
                                    <div>
                                        <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(outstandingPrincipal)}</p>
                                        <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                                            {outstandingHulamPutUp > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Hulam Put-up:</span>
                                                    <span className="text-orange-600 dark:text-orange-400">{formatCurrency(outstandingHulamPutUp)}</span>
                                                </div>
                                            )}
                                            {outstandingHulam > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Hulam:</span>
                                                    <span className="text-red-600 dark:text-red-400">{formatCurrency(outstandingHulam)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Interest This Period */}
                <Card className={isCurrentPeriodInterestPaid ? 'border-green-200 dark:border-green-800' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isCurrentPeriodInterestPaid ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                                <TrendingUp className={`h-5 w-5 ${isCurrentPeriodInterestPaid ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Interest {currentPeriod?.name || 'This Period'}
                                </p>
                                {isCurrentPeriodInterestPaid ? (
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">PAID ✓</p>
                                ) : (
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(currentPeriodInterest)}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Outstanding Balance */}
                <Card className={outstandingBalance > 0 ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800'}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${outstandingBalance > 0 ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                                <Banknote className={`h-5 w-5 ${outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                <p className={`text-xl font-bold ${outstandingBalance > 0 ? 'text-negative' : 'text-positive'}`}>
                                    {formatCurrency(Math.abs(outstandingBalance))}
                                    {outstandingBalance < 0 && ' (Credit)'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>
                            All transactions for this member across all periods.
                        </CardDescription>
                    </div>
                    <MemberTransactionDialog
                        memberId={member.id}
                        memberName={`${member.lastName}, ${member.firstName}`}
                        periods={periods}
                        trigger={
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </Button>
                        }
                    />
                </CardHeader>
                <CardContent>
                    {member.ledgerEntries.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No transactions recorded yet.</p>
                            <p className="text-sm mb-4">Add a transaction to start tracking this member&apos;s finances.</p>
                            <MemberTransactionDialog
                                memberId={member.id}
                                memberName={`${member.lastName}, ${member.firstName}`}
                                periods={periods}
                                trigger={
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Transaction
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-6 px-6">
                            <Table className="min-w-[800px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead className="text-right">Lawas</TableHead>
                                        <TableHead className="text-right">Put-up</TableHead>
                                        <TableHead className="text-right">Hulam Put-up</TableHead>
                                        <TableHead className="text-right">Hulam</TableHead>
                                        <TableHead className="text-right">Interest</TableHead>
                                        <TableHead className="text-right">Payment</TableHead>
                                        <TableHead className="text-right">Penalty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {member.ledgerEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="text-muted-foreground text-sm">{formatDate(entry.createdAt)}</TableCell>
                                            <TableCell className="font-medium">{entry.period?.name}</TableCell>
                                            <TableCell className="text-right">{entry.lawas}</TableCell>
                                            <TableCell className="text-right text-positive">{formatCurrency(entry.putUp)}</TableCell>
                                            <TableCell className="text-right text-orange-600 dark:text-orange-400">{formatCurrency(entry.hulamPutUp)}</TableCell>
                                            <TableCell className="text-right text-negative">{formatCurrency(entry.hulam)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(entry.interest)}</TableCell>
                                            <TableCell className="text-right text-positive">{formatCurrency(entry.payment)}</TableCell>
                                            <TableCell className="text-right text-negative">{formatCurrency(entry.penalty)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals Row */}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell colSpan={2}>Total</TableCell>
                                        <TableCell className="text-right">-</TableCell>
                                        <TableCell className="text-right text-positive">{formatCurrency(totals.putUp)}</TableCell>
                                        <TableCell className="text-right text-orange-600 dark:text-orange-400">{formatCurrency(totals.hulamPutUp)}</TableCell>
                                        <TableCell className="text-right text-negative">{formatCurrency(totals.hulam)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(interestOwed)}</TableCell>
                                        <TableCell className="text-right text-positive">{formatCurrency(totals.payment)}</TableCell>
                                        <TableCell className="text-right text-negative">{formatCurrency(totals.penalty)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

