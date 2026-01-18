'use client';

import { useState, ReactNode } from 'react';
import { createLedgerEntry } from '@/lib/actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Banknote, Check, Info, Percent, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface Period {
    id: number;
    name: string;
    isClosed: boolean;
}

interface OutstandingBreakdown {
    hulamPutUp: number;
    hulam: number;
    interest: number;
}

interface Props {
    memberId: number;
    memberName: string;
    outstanding: OutstandingBreakdown;
    totalPayments: number;
    periods: Period[];
    periodIdsWithInterestPaid: number[];
    trigger: ReactNode;
}

export function RecordPaymentDialog({ memberId, memberName, outstanding, totalPayments, periods, periodIdsWithInterestPaid, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [periodId, setPeriodId] = useState<string>('');
    const [paymentType, setPaymentType] = useState<'interest' | 'principal' | 'custom'>('principal');

    // Payment fields
    const [payHulamPutUp, setPayHulamPutUp] = useState('');
    const [payHulam, setPayHulam] = useState('');
    const [customAmount, setCustomAmount] = useState('');

    // Filter only active (non-closed) periods
    const activePeriods = periods.filter(p => !p.isClosed);

    // Check if interest is already paid for the selected period
    const selectedPeriodId = periodId ? parseInt(periodId) : null;
    const isInterestPaidForSelectedPeriod = selectedPeriodId
        ? periodIdsWithInterestPaid.includes(selectedPeriodId)
        : false;

    // Outstanding amounts
    const outstandingHulamPutUp = Math.max(0, outstanding.hulamPutUp);
    const outstandingHulam = Math.max(0, outstanding.hulam);
    const outstandingPrincipal = outstandingHulamPutUp + outstandingHulam;
    const interestOwed = outstanding.interest; // Interest for current period
    const totalOutstanding = outstandingPrincipal + interestOwed;

    // Calculate total payment based on type
    let totalPayment = 0;
    let paymentDescription = '';

    if (paymentType === 'interest') {
        totalPayment = interestOwed;
        paymentDescription = 'Interest Only';
    } else if (paymentType === 'principal') {
        const payHulamPutUpAmount = parseFloat(payHulamPutUp) || 0;
        const payHulamAmount = parseFloat(payHulam) || 0;
        totalPayment = payHulamPutUpAmount + payHulamAmount;
        paymentDescription = 'Principal Payment';
    } else {
        totalPayment = parseFloat(customAmount) || 0;
        paymentDescription = 'Custom Amount';
    }

    // Calculate new balances after payment (for preview)
    // IMPORTANT: After interest is paid, remaining payments go to principal
    // New interest is NOT calculated until the next period
    let newOutstandingPrincipal = outstandingPrincipal;
    let principalReduction = 0;
    let interestCovered = 0;

    if (paymentType === 'interest') {
        // Interest only - principal stays the same, interest will be 0 after
        newOutstandingPrincipal = outstandingPrincipal;
        interestCovered = interestOwed;
    } else if (paymentType === 'principal') {
        // Principal payments reduce the principal (interest already paid or not applicable)
        const payHulamPutUpAmount = parseFloat(payHulamPutUp) || 0;
        const payHulamAmount = parseFloat(payHulam) || 0;
        principalReduction = payHulamPutUpAmount + payHulamAmount;
        newOutstandingPrincipal = Math.max(0, outstandingPrincipal - principalReduction);
    } else {
        // Custom amount - first covers interest, then principal
        if (totalPayment <= interestOwed) {
            // Payment only covers interest (partial or full)
            newOutstandingPrincipal = outstandingPrincipal;
            interestCovered = totalPayment;
        } else {
            // Payment covers interest + some principal
            interestCovered = interestOwed;
            principalReduction = totalPayment - interestOwed;
            newOutstandingPrincipal = Math.max(0, outstandingPrincipal - principalReduction);
        }
    }

    // After payment, remaining interest for THIS period (not next period)
    const remainingInterestThisPeriod = Math.max(0, interestOwed - interestCovered);
    // Total outstanding after payment = remaining principal + remaining interest for this period
    const newTotalOutstanding = newOutstandingPrincipal + remainingInterestThisPeriod;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!periodId) {
            toast.error('Please select a period.');
            return;
        }

        if (totalPayment <= 0) {
            toast.error('Please enter a payment amount.');
            return;
        }

        setLoading(true);
        try {
            await createLedgerEntry({
                memberId,
                periodId: parseInt(periodId),
                lawas: '0',
                putUp: '0',
                hulamPutUp: '0',
                hulam: '0',
                payment: totalPayment.toString(),
                penalty: '0',
            });

            toast.success(`${paymentDescription}: ${formatCurrency(totalPayment)} recorded!`);
            setOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Failed to record payment. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setPeriodId('');
        setPaymentType('interest');
        setPayHulamPutUp('');
        setPayHulam('');
        setCustomAmount('');
    }

    function payAllHulamPutUp() {
        if (outstandingHulamPutUp > 0) setPayHulamPutUp(outstandingHulamPutUp.toString());
    }

    function payAllHulam() {
        if (outstandingHulam > 0) setPayHulam(outstandingHulam.toString());
    }

    function payFullBalance() {
        setPayHulamPutUp(outstandingHulamPutUp.toString());
        setPayHulam(outstandingHulam.toString());
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-green-600" />
                        Record Payment
                    </DialogTitle>
                    <DialogDescription>
                        Record a payment for <strong>{memberName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {activePeriods.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                        <p>No active periods available.</p>
                        <p className="text-sm mt-1">Create a new period first to record payments.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Outstanding Balance Breakdown */}
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Outstanding Balance</p>
                                <p className={`text-lg font-bold ${totalOutstanding > 0 ? 'text-negative' : 'text-positive'}`}>
                                    {formatCurrency(totalOutstanding)}
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                    <span>Principal (Hulam Put-up + Hulam):</span>
                                    <span className={outstandingPrincipal > 0 ? 'font-medium' : ''}>{formatCurrency(outstandingPrincipal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Interest (10% of principal):</span>
                                    <span className={interestOwed > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}>{formatCurrency(interestOwed)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Period Select */}
                        <div className="space-y-2">
                            <Label htmlFor="period">Period *</Label>
                            <Select value={periodId} onValueChange={setPeriodId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activePeriods.map((period) => (
                                        <SelectItem key={period.id} value={period.id.toString()}>
                                            {period.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Type Tabs */}
                        <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as typeof paymentType)}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger
                                    value="interest"
                                    className="flex items-center gap-1"
                                    disabled={isInterestPaidForSelectedPeriod || !periodId}
                                >
                                    <Percent className="h-3 w-3" />
                                    Interest Only
                                </TabsTrigger>
                                <TabsTrigger value="principal" className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    Principal
                                </TabsTrigger>
                                <TabsTrigger value="custom" className="flex items-center gap-1">
                                    <Banknote className="h-3 w-3" />
                                    Custom
                                </TabsTrigger>
                            </TabsList>

                            {/* Interest Only Tab */}
                            <TabsContent value="interest" className="space-y-3">
                                {isInterestPaidForSelectedPeriod ? (
                                    <div className="p-4 bg-muted rounded-lg border">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Check className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-medium">Interest Already Paid</p>
                                                <p className="text-xs mt-1">
                                                    Interest for this period has already been paid. You can still make a principal payment.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : !periodId ? (
                                    <div className="p-4 bg-muted rounded-lg border text-center text-muted-foreground">
                                        <p>Select a period first to pay interest.</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-blue-700 dark:text-blue-300">Interest Only Payment</p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                    Pay just the interest. Principal remains unchanged.
                                                </p>
                                            </div>
                                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                                {formatCurrency(interestOwed)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Principal Tab */}
                            <TabsContent value="principal" className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Pay down the principal to reduce future interest.</p>
                                    {outstandingPrincipal > 0 && (
                                        <Button type="button" variant="outline" size="sm" onClick={payFullBalance}>
                                            Pay All
                                        </Button>
                                    )}
                                </div>

                                {/* Pay Hulam Put-up */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="payHulamPutUp" className="text-xs text-muted-foreground">
                                            Hulam Put-up ({formatCurrency(outstandingHulamPutUp)} owed)
                                        </Label>
                                        <Input
                                            id="payHulamPutUp"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={outstandingHulamPutUp}
                                            placeholder="0.00"
                                            value={payHulamPutUp}
                                            onChange={(e) => setPayHulamPutUp(e.target.value)}
                                            className="border-orange-200 focus:border-orange-500"
                                        />
                                    </div>
                                    {outstandingHulamPutUp > 0 && (
                                        <Button type="button" variant="ghost" size="sm" onClick={payAllHulamPutUp} className="mt-5">
                                            Full
                                        </Button>
                                    )}
                                </div>

                                {/* Pay Hulam */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="payHulam" className="text-xs text-muted-foreground">
                                            Hulam/Loan ({formatCurrency(outstandingHulam)} owed)
                                        </Label>
                                        <Input
                                            id="payHulam"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={outstandingHulam}
                                            placeholder="0.00"
                                            value={payHulam}
                                            onChange={(e) => setPayHulam(e.target.value)}
                                            className="border-red-200 focus:border-red-500"
                                        />
                                    </div>
                                    {outstandingHulam > 0 && (
                                        <Button type="button" variant="ghost" size="sm" onClick={payAllHulam} className="mt-5">
                                            Full
                                        </Button>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Custom Amount Tab */}
                            <TabsContent value="custom" className="space-y-3">
                                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <p>Custom payments cover interest first, then reduce principal.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customAmount">Payment Amount</Label>
                                    <Input
                                        id="customAmount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        className="text-lg"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Payment Summary */}
                        {totalPayment > 0 && (
                            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-green-700 dark:text-green-300">{paymentDescription}:</span>
                                    <span className="text-xl font-bold text-green-700 dark:text-green-300">
                                        {formatCurrency(totalPayment)}
                                    </span>
                                </div>

                                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 space-y-1 text-sm">
                                    {paymentType === 'interest' && (
                                        <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                                            <span>Principal after payment:</span>
                                            <span className="font-medium">{formatCurrency(outstandingPrincipal)} (unchanged)</span>
                                        </div>
                                    )}
                                    {paymentType === 'principal' && principalReduction > 0 && (
                                        <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                                            <span>Principal reduced by:</span>
                                            <span className="font-medium">-{formatCurrency(principalReduction)}</span>
                                        </div>
                                    )}
                                    {paymentType === 'custom' && totalPayment > 0 && (
                                        <>
                                            <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                                                <span>→ Interest covered:</span>
                                                <span>{formatCurrency(Math.min(totalPayment, interestOwed))}</span>
                                            </div>
                                            {principalReduction > 0 && (
                                                <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                                                    <span>→ Principal reduced:</span>
                                                    <span>{formatCurrency(principalReduction)}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="flex items-center justify-between font-bold pt-1">
                                        <span className="text-muted-foreground">New Balance:</span>
                                        <span className={newTotalOutstanding > 0 ? 'text-negative' : 'text-positive'}>
                                            {formatCurrency(newTotalOutstanding)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading || totalPayment <= 0}>
                                <Check className="h-4 w-4 mr-2" />
                                {loading ? 'Recording...' : 'Record Payment'}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
