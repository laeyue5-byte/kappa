'use client';

import { useRouter } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Period {
    id: number;
    name: string;
    isClosed: boolean;
}

interface Props {
    periods: Period[];
    selectedPeriodId?: number;
}

export function LedgerPeriodSelector({ periods, selectedPeriodId }: Props) {
    const router = useRouter();

    function handlePeriodChange(value: string) {
        router.push(`/ledger?period=${value}`);
    }

    const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Period:</span>
            <Select
                value={selectedPeriodId?.toString()}
                onValueChange={handlePeriodChange}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    {periods.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                            <span className="flex items-center gap-2">
                                {p.name}
                                {p.isClosed && (
                                    <span className="text-xs text-muted-foreground">(Closed)</span>
                                )}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {selectedPeriod && (
                <Badge variant={selectedPeriod.isClosed ? 'secondary' : 'default'}>
                    {selectedPeriod.isClosed ? 'Closed' : 'Active'}
                </Badge>
            )}
        </div>
    );
}
