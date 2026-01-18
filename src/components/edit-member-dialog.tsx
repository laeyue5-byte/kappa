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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { updateMember, deleteMember } from '@/lib/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle } from 'lucide-react';

interface Props {
    member: {
        id: number;
        firstName: string;
        lastName: string;
        status: string;
    };
    trigger: React.ReactNode;
}

export function EditMemberDialog({ member, trigger }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [firstName, setFirstName] = useState(member.firstName);
    const [lastName, setLastName] = useState(member.lastName);
    const [status, setStatus] = useState(member.status);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!firstName.trim() || !lastName.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await updateMember(member.id, {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                status: status as 'active' | 'inactive' | 'deceased',
            });

            toast.success('Member updated successfully');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update member');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await deleteMember(member.id);
            toast.success('Member deleted successfully');
            router.push('/members');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete member');
            setDeleting(false);
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
                        <DialogTitle>Edit Member</DialogTitle>
                        <DialogDescription>
                            Update member information or manage their status.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="firstName" className="text-right">
                                First Name
                            </Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lastName" className="text-right">
                                Last Name
                            </Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                                Status
                            </Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Active
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                            Inactive
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="deceased">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            Deceased
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Delete Section */}
                        <div className="border-t pt-4 mt-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-destructive">Danger Zone</p>
                                    <p className="text-xs text-muted-foreground">Delete this member permanently</p>
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
                                                Delete Member?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete <strong>{member.lastName}, {member.firstName}</strong>?
                                                <br /><br />
                                                <span className="text-destructive font-medium">
                                                    This will permanently delete ALL their transaction history and ledger entries.
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
                                                disabled={deleting}
                                            >
                                                {deleting ? 'Deleting...' : 'Delete Member'}
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
