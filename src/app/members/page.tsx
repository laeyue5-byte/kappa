import { getMembersWithStats } from '@/lib/actions';
import { MembersTable } from '../../components/members-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Users } from 'lucide-react';
import Link from 'next/link';

interface Props {
    searchParams: Promise<{ q?: string; sort?: string; order?: string }>;
}

export default async function MembersPage({ searchParams }: Props) {
    const { q: searchQuery, sort = 'lastName', order = 'asc' } = await searchParams;
    const allMembers = await getMembersWithStats();

    // Filter members based on search query
    const filteredMembers = searchQuery
        ? allMembers.filter(m =>
            m.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${m.lastName}, ${m.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.id.toString().includes(searchQuery)
        )
        : allMembers;

    // Sort members
    const members = [...filteredMembers].sort((a, b) => {
        let comparison = 0;
        if (sort === 'id') {
            comparison = a.id - b.id;
        } else if (sort === 'lastName') {
            comparison = `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`);
        } else if (sort === 'firstName') {
            comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        } else if (sort === 'status') {
            comparison = a.status.localeCompare(b.status);
        } else if (sort === 'createdAt') {
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sort === 'lawas') {
            comparison = (a.stats?.totalLawas || 0) - (b.stats?.totalLawas || 0);
        } else if (sort === 'putUp') {
            comparison = (a.stats?.totalPutUp || 0) - (b.stats?.totalPutUp || 0);
        } else if (sort === 'hulamPutUp') {
            comparison = (a.stats?.remainingHulamPutUp || 0) - (b.stats?.remainingHulamPutUp || 0);
        } else if (sort === 'hulam') {
            comparison = (a.stats?.remainingHulam || 0) - (b.stats?.remainingHulam || 0);
        } else if (sort === 'interest') {
            comparison = (a.stats?.remainingInterest || 0) - (b.stats?.remainingInterest || 0);
        }
        return order === 'desc' ? -comparison : comparison;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                    <p className="text-muted-foreground">
                        Manage your Kapunungan members and view their transaction history.
                    </p>
                </div>
                <div className="flex gap-2">
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

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allMembers.length}</p>
                                <p className="text-sm text-muted-foreground">Total Members</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allMembers.filter(m => m.status === 'active').length}</p>
                                <p className="text-sm text-muted-foreground">Active Members</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                                <Users className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allMembers.filter(m => m.status === 'inactive').length}</p>
                                <p className="text-sm text-muted-foreground">Inactive Members</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Members Table */}
            <MembersTable
                members={members}
                allMembersCount={allMembers.length}
                searchQuery={searchQuery}
                currentSort={sort}
                currentOrder={order as 'asc' | 'desc'}
            />
        </div>
    );
}
