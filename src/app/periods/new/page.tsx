'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPeriod, createPeriodWithCarryForward, getPeriods } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Copy, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/back-button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Period {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date | null;
    isClosed: boolean;
}

export default function NewPeriodPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [periods, setPeriods] = useState<Period[]>([]);
    const [copyFromPeriodId, setCopyFromPeriodId] = useState<string>('');
    const [loadingPeriods, setLoadingPeriods] = useState(true);

    useEffect(() => {
        async function loadPeriods() {
            try {
                const allPeriods = await getPeriods();
                setPeriods(allPeriods);
            } catch (error) {
                console.error('Failed to load periods:', error);
            } finally {
                setLoadingPeriods(false);
            }
        }
        loadPeriods();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim() || !startDate) {
            toast.error('Please fill in the required fields.');
            return;
        }

        setLoading(true);
        try {
            if (copyFromPeriodId && copyFromPeriodId !== 'none') {
                // Create period with carry-forward from selected period
                const result = await createPeriodWithCarryForward(
                    parseInt(copyFromPeriodId),
                    {
                        name: name.trim(),
                        startDate: new Date(startDate),
                        endDate: endDate ? new Date(endDate) : undefined
                    }
                );
                toast.success(`Period created! ${result.migratedMemberCount} members with outstanding balances were carried forward with 10% interest.`);
            } else {
                // Create empty period
                await createPeriod({
                    name: name.trim(),
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : undefined
                });
                toast.success('Period created successfully!');
            }
            router.push('/periods');
        } catch (error) {
            toast.error('Failed to create period. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Generate suggested period name
    const suggestPeriodName = () => {
        const now = new Date();
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${months[now.getMonth()]} ${now.getFullYear()}`;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <BackButton fallbackHref="/periods" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Period</h1>
                    <p className="text-muted-foreground">
                        Create a new collection period for recording transactions.
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Period Details</CardTitle>
                    <CardDescription>
                        Enter the period name and date range.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Period Name *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="name"
                                    placeholder="e.g., JAN 2026"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setName(suggestPeriodName())}
                                >
                                    Suggest
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Use a descriptive name like &quot;JAN 2026&quot; or &quot;Q1 2026&quot;
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date (Optional)</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                />
                            </div>
                        </div>

                        {/* Copy from previous period */}
                        {periods.length > 0 && (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <Copy className="h-5 w-5 text-muted-foreground" />
                                    <Label className="text-base font-medium">Import Data from Previous Period</Label>
                                </div>
                                <div className="space-y-2">
                                    <Select
                                        value={copyFromPeriodId}
                                        onValueChange={setCopyFromPeriodId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a period to copy from (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Don&apos;t import - Start fresh</SelectItem>
                                            {periods.map((period) => (
                                                <SelectItem key={period.id} value={period.id.toString()}>
                                                    {period.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {copyFromPeriodId && copyFromPeriodId !== 'none' && (
                                        <div className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                                <p className="font-medium">When importing from a previous period:</p>
                                                <ul className="list-disc ml-4 mt-1 space-y-1">
                                                    <li>Outstanding loan balances will be carried forward</li>
                                                    <li><strong>10% interest</strong> will be charged on unpaid balances</li>
                                                    <li>Lawas (shares) count will be preserved</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Link href="/periods" className="flex-1">
                                <Button type="button" variant="outline" className="w-full">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" className="flex-1" disabled={loading}>
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? 'Creating...' : 'Create Period'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
