'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPeriod } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/back-button';

export default function NewPeriodPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim() || !startDate) {
            toast.error('Please fill in the required fields.');
            return;
        }

        setLoading(true);
        try {
            await createPeriod({
                name: name.trim(),
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : undefined
            });
            toast.success('Period created successfully!');
            router.push('/periods');
        } catch (error) {
            toast.error('Failed to create period. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

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
                            <Input
                                id="name"
                                placeholder="e.g., JAN-FEB 2025"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                Use a descriptive name like &quot;JAN-FEB 2025&quot; or &quot;Q1 2025&quot;
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
