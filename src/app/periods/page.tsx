import { getPeriods } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarDays, Lock, Unlock, Eye, ArrowRightCircle, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/format';
import { ClosePeriodDialog } from '@/components/close-period-dialog';
import { DeletePeriodDialog } from '@/components/delete-period-dialog';
import { EditPeriodDialog } from '@/components/edit-period-dialog';

export default async function PeriodsPage() {
    const periods = await getPeriods();
    const activePeriod = periods.find(p => !p.isClosed);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Periods</h1>
                    <p className="text-muted-foreground">
                        Manage collection periods for your Kapunungan.
                    </p>
                </div>
                <div className="flex gap-2">
                    {activePeriod && (
                        <ClosePeriodDialog
                            currentPeriodId={activePeriod.id}
                            currentPeriodName={activePeriod.name}
                            trigger={
                                <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950">
                                    <ArrowRightCircle className="h-4 w-4 mr-2" />
                                    Close & Start New
                                </Button>
                            }
                        />
                    )}
                    <Link href="/periods/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Period
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Periods Grid */}
            {periods.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No periods yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first period to start recording transactions.
                            </p>
                            <Link href="/periods/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Period
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {periods.map((period) => (
                        <Card key={period.id} className={period.isClosed ? 'opacity-75' : 'border-primary/50'}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{period.name}</CardTitle>
                                        <CardDescription>
                                            {formatDate(period.startDate)}
                                            {period.endDate && ` - ${formatDate(period.endDate)}`}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={period.isClosed ? 'secondary' : 'default'}>
                                        {period.isClosed ? (
                                            <>
                                                <Lock className="h-3 w-3 mr-1" />
                                                Closed
                                            </>
                                        ) : (
                                            <>
                                                <Unlock className="h-3 w-3 mr-1" />
                                                Active
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Link href={`/ledger?period=${period.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Ledger
                                        </Button>
                                    </Link>
                                    {!period.isClosed && (
                                        <ClosePeriodDialog
                                            currentPeriodId={period.id}
                                            currentPeriodName={period.name}
                                            trigger={
                                                <Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400">
                                                    <ArrowRightCircle className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                    )}
                                    <EditPeriodDialog
                                        period={period}
                                        trigger={
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                    <DeletePeriodDialog
                                        periodId={period.id}
                                        periodName={period.name}
                                        trigger={
                                            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
