import { getDashboardStats, getPeriods, getMembers } from '@/lib/actions';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Banknote,
  PiggyBank,
  AlertTriangle,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const periods = await getPeriods();
  const members = await getMembers();

  const activePeriod = periods.find(p => !p.isClosed);
  const activeMembers = members.filter(m => m.status === 'active');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to PaskuhayConnect. Manage your Kapunungan finances with ease.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/members/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Period Banner */}
      {activePeriod ? (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="rounded-full">Active</Badge>
              <span className="font-medium">{activePeriod.name}</span>
            </div>
            <Link href={`/ledger?period=${activePeriod.id}`}>
              <Button variant="outline" size="sm">View Ledger</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-warning bg-warning/10">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="text-sm">No active period. Create one to start recording transactions.</span>
            </div>
            <Link href="/periods/new">
              <Button variant="outline" size="sm">Create Period</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          description={`${activeMembers.length} active`}
          trend="neutral"
        />
        <StatCard
          title="Total Lawas (Shares)"
          value={stats.totalLawas}
          icon={PiggyBank}
          description={`₱2,000 per Lawas`}
          trend="neutral"
        />
        <StatCard
          title="Outstanding Loans"
          value={formatCurrency(stats.outstandingLoans)}
          icon={Banknote}
          description={`of ${formatCurrency(stats.totalLoans)} total loans`}
          trend={stats.outstandingLoans > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="Total Capital"
          value={formatCurrency(stats.totalCapital)}
          icon={Wallet}
          description="Put-up + Interest + Penalties"
          trend="positive"
        />
      </div>

      {/* Put-up Status Card */}
      {(() => {
        const PUT_UP_PER_LAWAS = 2000;
        const requiredPutUp = stats.totalLawas * PUT_UP_PER_LAWAS;
        const collectedPutUp = stats.totalPutUp + (stats.totalHulamPutUp || 0); // Cash + Borrowed
        const remainingPutUp = Math.max(0, requiredPutUp - collectedPutUp);
        const percentComplete = requiredPutUp > 0 ? Math.round((collectedPutUp / requiredPutUp) * 100) : 0;

        return (
          <Card className={remainingPutUp === 0 && requiredPutUp > 0 ? 'border-green-200 dark:border-green-800' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Put-up Status (Membership Fees)
              </CardTitle>
              <CardDescription>
                Annual membership contribution based on {stats.totalLawas} total Lawas @ ₱2,000 each
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Required Put-up</p>
                  <p className="text-2xl font-bold">{formatCurrency(requiredPutUp)}</p>
                  <p className="text-xs text-muted-foreground">{stats.totalLawas} Lawas × ₱2,000</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cash Collected</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalPutUp)}</p>
                  <p className="text-xs text-muted-foreground">Direct contributions</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Borrowed (Hulam Put-up)</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(stats.totalHulamPutUp || 0)}</p>
                  <p className="text-xs text-muted-foreground">Counts as contribution</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  {remainingPutUp === 0 ? (
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">COMPLETE ✓</p>
                  ) : (
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(remainingPutUp)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{percentComplete}% collected</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, percentComplete)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-positive" />
              Interest Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-positive">
              {formatCurrency(stats.totalInterest)}
            </div>
            <p className="text-xs text-muted-foreground">10% per period on loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPayments)}
            </div>
            <p className="text-xs text-muted-foreground">Loan repayments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-negative" />
              Total Penalties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-negative">
              {formatCurrency(stats.totalPenalty)}
            </div>
            <p className="text-xs text-muted-foreground">Late fees & fines</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your Kapunungan</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/members">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                View All Members
              </Button>
            </Link>
            <Link href="/ledger">
              <Button variant="outline" className="w-full justify-start">
                <Banknote className="h-4 w-4 mr-2" />
                Record Transaction
              </Button>
            </Link>
            <Link href="/periods">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Manage Periods
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest transactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.totalMembers === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members yet.</p>
                <p className="text-sm">Add members to start tracking transactions.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Activity feed coming soon...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
