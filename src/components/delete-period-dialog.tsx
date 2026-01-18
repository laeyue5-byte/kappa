'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { deletePeriod } from '@/lib/actions';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';

interface Props {
    periodId: number;
    periodName: string;
    trigger: React.ReactNode;
}

export function DeletePeriodDialog({ periodId, periodName, trigger }: Props) {
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        try {
            await deletePeriod(periodId);
            toast.success(`Period "${periodName}" deleted successfully`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete period');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Period?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>&quot;{periodName}&quot;</strong>?
                        <br /><br />
                        <span className="text-destructive font-medium">
                            This will permanently delete ALL ledger entries/transactions in this period.
                        </span>
                        <br />
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete Period'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
