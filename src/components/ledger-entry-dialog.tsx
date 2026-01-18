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
import { toast } from 'sonner';
import { Save, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface Member {
    id: number;
    firstName: string;
    lastName: string;
}

interface Props {
    periodId: number;
    members: Member[];
    trigger: ReactNode;
}

export function LedgerEntryDialog({ periodId, members, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [memberId, setMemberId] = useState<string>('');
    const [lawas, setLawas] = useState('');
    const [putUp, setPutUp] = useState('');
    const [hulamPutUp, setHulamPutUp] = useState('');
    const [hulam, setHulam] = useState('');
    const [payment, setPayment] = useState('');
    const [penalty, setPenalty] = useState('');

    // Calculate interest preview (10% on both Hulam and Hulam Put-up)
    const hulamAmount = parseFloat(hulam) || 0;
    const hulamPutUpAmount = parseFloat(hulamPutUp) || 0;
    const totalForInterest = hulamAmount + hulamPutUpAmount;
    const interestPreview = totalForInterest * 0.10;

    // Calculate required put-up based on lawas (₱2,000 per lawas)
    const lawasCount = parseFloat(lawas) || 0;
    const requiredPutUp = lawasCount * 2000;
    const actualPutUp = parseFloat(putUp) || 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!memberId) {
            toast.error('Please select a member.');
            return;
        }

        setLoading(true);
        try {
            await createLedgerEntry({
                memberId: parseInt(memberId),
                periodId,
                lawas: lawas || '0',
                putUp: putUp || '0',
                hulamPutUp: hulamPutUp || '0',
                hulam: hulam || '0',
                payment: payment || '0',
                penalty: penalty || '0',
            });
            toast.success('Transaction recorded successfully!');
            setOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Failed to record transaction. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setMemberId('');
        setLawas('');
        setPutUp('');
        setHulamPutUp('');
        setHulam('');
        setPayment('');
        setPenalty('');
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>
                        Record a new transaction for a member in this period.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Member Select */}
                    <div className="space-y-2">
                        <Label htmlFor="member">Member *</Label>
                        <Select value={memberId} onValueChange={setMemberId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((member) => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                        {member.lastName}, {member.firstName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Lawas and Required Put-up */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lawas">Lawas (# of Shares)</Label>
                            <Input
                                id="lawas"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0"
                                value={lawas}
                                onChange={(e) => setLawas(e.target.value)}
                            />
                            {lawasCount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Required: ₱{requiredPutUp.toLocaleString()} ({lawasCount} × ₱2,000)
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="putUp">Put-up (Cash Paid)</Label>
                            <Input
                                id="putUp"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={putUp}
                                onChange={(e) => setPutUp(e.target.value)}
                                className="border-green-200 focus:border-green-500"
                            />
                            {requiredPutUp > 0 && actualPutUp < requiredPutUp && (
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                    Short: ₱{(requiredPutUp - actualPutUp).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hulamPutUp">Hulam Put-up (Borrowed Put-up)</Label>
                            <Input
                                id="hulamPutUp"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={hulamPutUp}
                                onChange={(e) => setHulamPutUp(e.target.value)}
                                className="border-orange-200 focus:border-orange-500"
                            />
                            <p className="text-xs text-muted-foreground">
                                Use when member can&apos;t pay put-up in cash (10% interest)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hulam">Hulam (Loan)</Label>
                            <Input
                                id="hulam"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={hulam}
                                onChange={(e) => setHulam(e.target.value)}
                                className="border-red-200 focus:border-red-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment">Payment</Label>
                            <Input
                                id="payment"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={payment}
                                onChange={(e) => setPayment(e.target.value)}
                                className="border-green-200 focus:border-green-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="penalty">Penalty</Label>
                            <Input
                                id="penalty"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={penalty}
                                onChange={(e) => setPenalty(e.target.value)}
                                className="border-red-200 focus:border-red-500"
                            />
                        </div>
                    </div>

                    {/* Interest Preview */}
                    {totalForInterest > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                                    <Calculator className="h-4 w-4" />
                                    Auto-Calculated Interest (10%)
                                </Label>
                                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(interestPreview)}</span>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Based on: {hulamPutUpAmount > 0 && `Hulam Put-up ${formatCurrency(hulamPutUpAmount)}`}
                                {hulamPutUpAmount > 0 && hulamAmount > 0 && ' + '}
                                {hulamAmount > 0 && `Hulam ${formatCurrency(hulamAmount)}`}
                            </p>
                        </div>
                    )}

                    {/* Summary */}
                    {(totalForInterest > 0 || parseFloat(putUp) > 0) && (
                        <div className="p-3 bg-muted rounded-lg text-sm">
                            <p className="font-medium mb-1">Transaction Summary:</p>
                            <ul className="space-y-1 text-muted-foreground">
                                {parseFloat(putUp) > 0 && <li>+ Savings: {formatCurrency(parseFloat(putUp))}</li>}
                                {hulamPutUpAmount > 0 && <li>+ Hulam Put-up: {formatCurrency(hulamPutUpAmount)}</li>}
                                {hulamAmount > 0 && <li>+ Loan: {formatCurrency(hulamAmount)}</li>}
                                {totalForInterest > 0 && <li>+ Interest: {formatCurrency(interestPreview)}</li>}
                                {parseFloat(payment) > 0 && <li>- Payment: {formatCurrency(parseFloat(payment))}</li>}
                            </ul>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Transaction'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
