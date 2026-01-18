import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: 'positive' | 'negative' | 'neutral';
    className?: string;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend = 'neutral',
    className
}: StatCardProps) {
    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn(
                    'p-2 rounded-lg',
                    trend === 'positive' && 'bg-positive',
                    trend === 'negative' && 'bg-negative',
                    trend === 'neutral' && 'bg-muted'
                )}>
                    <Icon className={cn(
                        'h-4 w-4',
                        trend === 'positive' && 'text-positive',
                        trend === 'negative' && 'text-negative',
                        trend === 'neutral' && 'text-muted-foreground'
                    )} />
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn(
                    'text-2xl font-bold',
                    trend === 'positive' && 'text-positive',
                    trend === 'negative' && 'text-negative'
                )}>
                    {value}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
