'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';
import { Plus, Search, Users, Eye, Upload, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { formatDate, getInitials } from '@/lib/utils/format';
import { useState, useEffect } from 'react';
import { DeleteMemberTransactionsDialog } from '@/components/delete-member-transactions-dialog';

interface Member {
    id: number;
    firstName: string;
    lastName: string;
    status: string;
    createdAt: Date;
    stats?: {
        totalLawas: number;
        totalPutUp: number;
        remainingHulamPutUp: number;
        remainingHulam: number;
        remainingInterest: number;
    };
}

interface Props {
    members: Member[];
    allMembersCount: number;
    searchQuery?: string;
    currentSort: string;
    currentOrder: 'asc' | 'desc';
}

export function MembersTable({ members, allMembersCount, searchQuery, currentSort, currentOrder }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchQuery || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            const currentQ = params.get('q') || '';
            const newQ = search || '';

            if (currentQ !== newQ) {
                if (newQ) {
                    params.set('q', newQ);
                } else {
                    params.delete('q');
                }
                router.push(`/members?${params.toString()}`);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, router, searchParams]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        deceased: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    function handleSort(column: string) {
        const params = new URLSearchParams(searchParams.toString());

        if (currentSort === column) {
            params.set('order', currentOrder === 'asc' ? 'desc' : 'asc');
        } else {
            params.set('sort', column);
            params.set('order', 'asc');
        }

        router.push(`/members?${params.toString()}`);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (search) {
            params.set('q', search);
        } else {
            params.delete('q');
        }
        router.push(`/members?${params.toString()}`);
    }

    function clearSearch() {
        setSearch('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        router.push(`/members?${params.toString()}`);
    }

    function SortIcon({ column }: { column: string }) {
        if (currentSort !== column) {
            return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
        }
        return currentOrder === 'asc'
            ? <ArrowUp className="h-4 w-4 ml-1" />
            : <ArrowDown className="h-4 w-4 ml-1" />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>All Members</CardTitle>
                        <CardDescription>
                            Click on a member to view their transaction history.
                        </CardDescription>
                    </div>
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 w-full sm:w-[250px]"
                            />
                        </div>
                        <Button type="submit" size="sm" className="hidden sm:inline-flex">Search</Button>
                        {searchQuery && (
                            <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </form>
                </div>
            </CardHeader>
            <CardContent>
                {/* Search Results Info */}
                {searchQuery && (
                    <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                        <p className="text-sm">
                            Found <strong>{members.length}</strong> member{members.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                        </p>
                        <Button variant="ghost" size="sm" onClick={clearSearch}>Clear search</Button>
                    </div>
                )}

                {allMembersCount === 0 ? (
                    <div className="text-center py-12">
                        <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Add your first member or import from a CSV file.
                        </p>
                        <div className="flex gap-2 justify-center flex-wrap">
                            <Link href="/members/import">
                                <Button variant="outline">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import CSV
                                </Button>
                            </Link>
                            <Link href="/members/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Member
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center py-12">
                        <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No results found</h3>
                        <p className="text-muted-foreground mb-4">
                            No members match your search for &quot;{searchQuery}&quot;
                        </p>
                        <Button variant="outline" onClick={clearSearch}>Clear search</Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-6 px-6">
                        <Table className="min-w-[900px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 font-semibold"
                                            onClick={() => handleSort('id')}
                                        >
                                            ID
                                            <SortIcon column="id" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 font-semibold"
                                            onClick={() => handleSort('lastName')}
                                        >
                                            Name
                                            <SortIcon column="lastName" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 font-semibold"
                                            onClick={() => handleSort('lawas')}
                                        >
                                            Lawas
                                            <SortIcon column="lawas" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 font-semibold"
                                            onClick={() => handleSort('putUp')}
                                        >
                                            Put-up
                                            <SortIcon column="putUp" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 font-semibold"
                                            onClick={() => handleSort('hulamPutUp')}
                                        >
                                            Hulam Put-up
                                            <SortIcon column="hulamPutUp" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 font-semibold"
                                            onClick={() => handleSort('hulam')}
                                        >
                                            Hulam Loan
                                            <SortIcon column="hulam" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 font-semibold"
                                            onClick={() => handleSort('interest')}
                                        >
                                            Interest
                                            <SortIcon column="interest" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 font-semibold"
                                            onClick={() => handleSort('status')}
                                        >
                                            Status
                                            <SortIcon column="status" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-mono text-muted-foreground">{member.id}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-xs font-medium text-primary">
                                                        {getInitials(member.firstName, member.lastName)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{member.lastName}, {member.firstName}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {member.stats?.totalLawas || 0}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 dark:text-green-400">
                                            {formatCurrency(member.stats?.totalPutUp || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-orange-600 dark:text-orange-400">
                                            {formatCurrency(member.stats?.remainingHulamPutUp || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600 dark:text-red-400">
                                            {formatCurrency(member.stats?.remainingHulam || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-yellow-600 dark:text-yellow-400">
                                            {formatCurrency(member.stats?.remainingInterest || 0)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[member.status]} variant="secondary">
                                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/members/${member.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DeleteMemberTransactionsDialog
                                                    memberId={member.id}
                                                    memberName={`${member.lastName}, ${member.firstName}`}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            {members.length > 0 && (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={2} className="font-bold">Total</TableCell>
                                        <TableCell className="text-right font-bold">
                                            {members.reduce((acc, m) => acc + (m.stats?.totalLawas || 0), 0)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(members.reduce((acc, m) => acc + (m.stats?.totalPutUp || 0), 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-orange-600 dark:text-orange-400">
                                            {formatCurrency(members.reduce((acc, m) => acc + (m.stats?.remainingHulamPutUp || 0), 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                                            {formatCurrency(members.reduce((acc, m) => acc + (m.stats?.remainingHulam || 0), 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-yellow-600 dark:text-yellow-400">
                                            {formatCurrency(members.reduce((acc, m) => acc + (m.stats?.remainingInterest || 0), 0))}
                                        </TableCell>
                                        <TableCell colSpan={2} />
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
