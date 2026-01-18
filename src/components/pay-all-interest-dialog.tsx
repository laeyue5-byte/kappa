'use client';

import { useState, ReactNode, useEffect } from 'react';
import { payAllMembersInterest, undoPayAllMembersInterest, getPeriods } from '@/lib/actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Percent, CheckCircle, AlertTriangle, Undo2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface Period {
    id: number;
    name: string;
}

interface Props {
    membersWithInterest: number;
    totalInterestDue: number;
    trigger: ReactNode;
}

export function PayAllInterestDialog({ membersWithInterest, totalInterestDue, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [periodId, setPeriodId] = useState<string>('');
    const [periods, setPeriods] = useState<Period[]>([]);
    const [loadingPeriods, setLoadingPeriods] = useState(true);

    useEffect(() => {
        async function loadPeriods() {
            try {
                const allPeriods = await getPeriods();
                setPeriods(allPeriods);
                // Default to most recent period
                if (allPeriods.length > 0) {
                    setPeriodId(allPeriods[0].id.toString());
                }
            } catch (error) {
                console.error('Failed to load periods:', error);
            } finally {
                setLoadingPeriods(false);
            }
        }
        if (open) {
            loadPeriods();
        }
    }, [open]);

    async function handleUndo(entryIds: number[]) {
        try {
            const result = await undoPayAllMembersInterest(entryIds);
            if (result.success) {
                toast.success(`Undo successful! ${result.entriesDeleted} payment entries removed.`);
            } else {
                toast.error('Failed to undo. The entries may have already been modified.');
            }
        } catch (error) {
            toast.error('Failed to undo. Please try again.');
            console.error(error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!periodId) {
            toast.error('Please select a period.');
            return;
        }

        setLoading(true);
        try {
            const result = await payAllMembersInterest(parseInt(periodId));

            // Show success toast with Undo button
            toast.success(
                `Interest paid for ${result.membersPaid} members! Total: ${formatCurrency(result.totalInterestPaid)}`,
                {
                    duration: 10000, // Show for 10 seconds
                    action: {
                        label: 'Undo',
                        onClick: () => handleUndo(result.entryIds),
                    },
                }
            );
            setOpen(false);
        } catch (error) {
            toast.error('Failed to process interest payments. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (membersWithInterest === 0) {
        return (
            <Button variant="outline" disabled className="border-green-200 text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                All Interest Paid
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Percent className="h-5 w-5 text-blue-600" />
                            Pay All Interest
                        </DialogTitle>
                        <DialogDescription>
                            Record interest payments for all members with outstanding interest.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        {/* Summary */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Members with Interest Due:</span>
                                <span className="font-bold text-blue-700 dark:text-blue-300">{membersWithInterest}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total Interest to Collect:</span>
                                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalInterestDue)}</span>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p>This will create payment entries for <strong>all {membersWithInterest} members</strong> with outstanding interest in the selected period.</p>
                            </div>
                        </div>

                        {/* Period Select */}
                        <div className="space-y-2">
                            <Label htmlFor="period">Record Payments in Period *</Label>
                            <Select
                                value={periodId}
                                onValueChange={setPeriodId}
                                disabled={loadingPeriods}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingPeriods ? "Loading..." : "Select a period"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((period) => (
                                        <SelectItem key={period.id} value={period.id.toString()}>
                                            {period.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !periodId || membersWithInterest === 0}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Percent className="h-4 w-4 mr-2" />
                            {loading ? 'Processing...' : `Pay All Interest (${membersWithInterest})`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
