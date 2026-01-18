'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { closePeriodAndMigrate } from '@/lib/actions';
import { toast } from 'sonner';
import { ArrowRight, Calendar, AlertTriangle } from 'lucide-react';

interface Props {
    currentPeriodId: number;
    currentPeriodName: string;
    trigger: React.ReactNode;
}

export function ClosePeriodDialog({ currentPeriodId, currentPeriodName, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newPeriodName, setNewPeriodName] = useState('');

    // Generate suggested period name (next month)
    const suggestPeriodName = () => {
        const now = new Date();
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const nextMonth = (now.getMonth() + 1) % 12;
        const year = nextMonth === 0 ? now.getFullYear() + 1 : now.getFullYear();
        return `${months[nextMonth]} ${year}`;
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!newPeriodName.trim()) {
            toast.error('Please enter a name for the new period');
            return;
        }

        setLoading(true);
        try {
            const result = await closePeriodAndMigrate(currentPeriodId, {
                name: newPeriodName.trim(),
                startDate: new Date(),
            });

            toast.success(
                `Period closed! Created "${result.newPeriod.name}" with ${result.migratedMemberCount} members migrated.`
            );
            setOpen(false);
            setNewPeriodName('');
        } catch (error) {
            console.error(error);
            toast.error('Failed to close period and migrate');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Close Period & Start New
                        </DialogTitle>
                        <DialogDescription>
                            Close <strong>&quot;{currentPeriodName}&quot;</strong> and migrate all outstanding balances to the new period.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        {/* Warning */}
                        <div className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-medium">This will:</p>
                                <ul className="list-disc ml-4 mt-1 space-y-1">
                                    <li>Close the current period (no more edits)</li>
                                    <li>Create a new active period</li>
                                    <li>Carry forward outstanding balances for all members</li>
                                    <li>New interest (10%) will be charged on outstanding loans</li>
                                </ul>
                            </div>
                        </div>

                        {/* Migration Flow */}
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <div className="px-3 py-2 bg-muted rounded-lg font-medium">
                                {currentPeriodName}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                                {newPeriodName || '???'}
                            </div>
                        </div>

                        {/* New Period Name */}
                        <div className="space-y-2">
                            <Label htmlFor="newPeriodName">New Period Name</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="newPeriodName"
                                    value={newPeriodName}
                                    onChange={(e) => setNewPeriodName(e.target.value)}
                                    placeholder="e.g., FEB 2026"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setNewPeriodName(suggestPeriodName())}
                                >
                                    Suggest
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !newPeriodName.trim()}>
                            {loading ? 'Processing...' : 'Close & Migrate'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
