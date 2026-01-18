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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateLedgerEntry, deleteLedgerEntry } from '@/lib/actions';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';

interface Props {
    entry: {
        id: number;
        lawas: string;
        putUp: string;
        hulamPutUp: string;
        hulam: string;
        payment: string;
        penalty: string;
    };
    memberName: string;
    trigger: React.ReactNode;
}

export function EditLedgerEntryDialog({ entry, memberName, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [lawas, setLawas] = useState(entry.lawas);
    const [putUp, setPutUp] = useState(entry.putUp);
    const [hulamPutUp, setHulamPutUp] = useState(entry.hulamPutUp);
    const [hulam, setHulam] = useState(entry.hulam);
    const [payment, setPayment] = useState(entry.payment);
    const [penalty, setPenalty] = useState(entry.penalty);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);
        try {
            await updateLedgerEntry(entry.id, {
                lawas,
                putUp,
                hulamPutUp,
                hulam,
                payment,
                penalty,
            });

            toast.success('Transaction updated successfully');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update transaction');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await deleteLedgerEntry(entry.id);
            toast.success('Transaction deleted successfully');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete transaction');
            setDeleting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Transaction</DialogTitle>
                        <DialogDescription>
                            Modify transaction for <strong>{memberName}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Lawas */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lawas" className="text-right">
                                Lawas
                            </Label>
                            <Input
                                id="lawas"
                                type="number"
                                min="0"
                                step="1"
                                value={lawas}
                                onChange={(e) => setLawas(e.target.value)}
                                className="col-span-3"
                            />
                        </div>

                        {/* Put-up */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="putUp" className="text-right">
                                Put-up
                            </Label>
                            <Input
                                id="putUp"
                                type="number"
                                min="0"
                                step="0.01"
                                value={putUp}
                                onChange={(e) => setPutUp(e.target.value)}
                                className="col-span-3"
                                placeholder="Cash contribution"
                            />
                        </div>

                        {/* Hulam Put-up */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="hulamPutUp" className="text-right text-orange-600">
                                Hulam Put-up
                            </Label>
                            <Input
                                id="hulamPutUp"
                                type="number"
                                min="0"
                                step="0.01"
                                value={hulamPutUp}
                                onChange={(e) => setHulamPutUp(e.target.value)}
                                className="col-span-3"
                                placeholder="Borrowed put-up"
                            />
                        </div>

                        {/* Hulam */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="hulam" className="text-right text-red-600">
                                Hulam
                            </Label>
                            <Input
                                id="hulam"
                                type="number"
                                min="0"
                                step="0.01"
                                value={hulam}
                                onChange={(e) => setHulam(e.target.value)}
                                className="col-span-3"
                                placeholder="Loan amount"
                            />
                        </div>

                        {/* Payment */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="payment" className="text-right text-green-600">
                                Payment
                            </Label>
                            <Input
                                id="payment"
                                type="number"
                                min="0"
                                step="0.01"
                                value={payment}
                                onChange={(e) => setPayment(e.target.value)}
                                className="col-span-3"
                                placeholder="Payment received"
                            />
                        </div>

                        {/* Penalty */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="penalty" className="text-right text-red-600">
                                Penalty
                            </Label>
                            <Input
                                id="penalty"
                                type="number"
                                min="0"
                                step="0.01"
                                value={penalty}
                                onChange={(e) => setPenalty(e.target.value)}
                                className="col-span-3"
                                placeholder="Fines/Penalties"
                            />
                        </div>

                        {/* Delete Section */}
                        <div className="border-t pt-4 mt-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-destructive">Danger Zone</p>
                                    <p className="text-xs text-muted-foreground">Delete this transaction</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                                Delete Transaction?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this transaction for <strong>{memberName}</strong>?
                                                <br /><br />
                                                This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                disabled={deleting}
                                            >
                                                {deleting ? 'Deleting...' : 'Delete'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
